import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Manufacturing from '../models/Manufacturing.js';
import Item from '../models/Item.js';
import RawMaterial from '../models/RawMaterial.js';
import ItemBom from '../models/ItemBom.js';
import getNextSequence from '../utils/getNextSequence.js';

const router = express.Router();

const formatManufacturingRecord = (record) => {
  const item = record.item || {};
  return {
    id: record.legacy_id,
    item_id: item.legacy_id,
    item_name: item.name,
    sku: item.sku,
    quantity_manufactured: record.quantity_manufactured,
    batch_number: record.batch_number,
    staff_name: record.staff_name,
    manufacturing_date: record.manufacturing_date
      ? new Date(record.manufacturing_date).toISOString().split('T')[0]
      : null,
    manufacturing_time: record.manufacturing_time,
    notes: record.notes,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
};

// Get all manufacturing records
router.get('/', async (_req, res) => {
  try {
    const records = await Manufacturing.find()
      .populate('item', 'name sku legacy_id')
      .sort({ manufacturing_date: -1, manufacturing_time: -1 })
      .lean();

    const formatted = records.map(formatManufacturingRecord);
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching manufacturing records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch manufacturing records' });
  }
});

// Get manufacturing record by ID
router.get('/:id', async (req, res) => {
  try {
    const numericId = Number(req.params.id);

    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid manufacturing record ID' });
    }

    const record = await Manufacturing.findOne({ legacy_id: numericId })
      .populate('item', 'name sku legacy_id')
      .lean();

    if (!record) {
      return res.status(404).json({ success: false, error: 'Manufacturing record not found' });
    }

    res.json({ success: true, data: formatManufacturingRecord(record) });
  } catch (error) {
    console.error('Error fetching manufacturing record:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch manufacturing record' });
  }
});

// Create new manufacturing record(s) - supports single or multiple items
router.post(
  '/',
  [
    body('item_id').optional().isInt({ min: 1 }).withMessage('Valid item ID is required'),
    body('quantity_manufactured').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('items').optional().isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.item_id')
      .if(body('items').exists())
      .isInt({ min: 1 })
      .withMessage('Each item must have a valid item ID'),
    body('items.*.quantity_manufactured')
      .if(body('items').exists())
      .isInt({ min: 1 })
      .withMessage('Each item must have a valid quantity'),
    body('batch_number').optional({ checkFalsy: true }).isString().withMessage('Batch number must be text'),
    body('staff_name').notEmpty().trim().withMessage('Staff name is required'),
    body('manufacturing_date').isISO8601().withMessage('Valid manufacturing date is required'),
    body('manufacturing_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/)
      .withMessage('Valid time format is required (HH:MM or HH:MM:SS)'),
  ],
  async (req, res) => {
    const session = await mongoose.startSession();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg).join(', ');
        return res.status(400).json({ success: false, error: errorMessages, errors: errors.array() });
      }

      const {
        items,
        item_id,
        quantity_manufactured,
        batch_number,
        staff_name,
        manufacturing_date,
        manufacturing_time,
        notes,
      } = req.body;

      const normalizedTime =
        manufacturing_time.length === 5 ? `${manufacturing_time}:00` : manufacturing_time;

      let itemsToProcess = [];
      if (Array.isArray(items) && items.length > 0) {
        itemsToProcess = items.map((item) => ({
          item_id: Number(item.item_id),
          quantity_manufactured: Number(item.quantity_manufactured),
        }));
      } else if (item_id && quantity_manufactured) {
        itemsToProcess = [
          {
            item_id: Number(item_id),
            quantity_manufactured: Number(quantity_manufactured),
          },
        ];
      } else {
        return res.status(400).json({
          success: false,
          error: 'Either items array or item_id with quantity_manufactured is required',
        });
      }

      const itemIds = itemsToProcess.map((item) => item.item_id);
      const itemsDocs = await Item.find({ legacy_id: { $in: itemIds } }).session(session);
      if (itemsDocs.length !== itemIds.length) {
        const foundIds = itemsDocs.map((doc) => doc.legacy_id);
        const missingIds = itemIds.filter((id) => !foundIds.includes(id));
        return res.status(400).json({ success: false, error: `Items not found: ${missingIds.join(', ')}` });
      }

      const itemMap = new Map(itemsDocs.map((doc) => [doc.legacy_id, doc]));
      const createdRecords = [];
      const shortages = [];

      await session.withTransaction(async () => {
        for (const itemData of itemsToProcess) {
          const { item_id: currentItemLegacyId, quantity_manufactured: currentQuantity } = itemData;
          const itemDoc = itemMap.get(currentItemLegacyId);

          const bomEntries = await ItemBom.find({ item: itemDoc._id })
            .populate('raw_material')
            .session(session);

          if (bomEntries.length > 0) {
            const itemShortages = [];
            for (const entry of bomEntries) {
              const requiredQty = Number(entry.quantity_per_unit) * Number(currentQuantity);
              const materialDoc = entry.raw_material;

              if (!materialDoc) continue;

              if (Number(materialDoc.current_stock) < requiredQty) {
                itemShortages.push({
                  item_name: itemDoc.name,
                  raw_material_id: materialDoc.legacy_id,
                  raw_material_name: materialDoc.name,
                  required: requiredQty,
                  available: Number(materialDoc.current_stock),
                  unit: entry.unit,
                });
              }
            }

            if (itemShortages.length > 0) {
              shortages.push(...itemShortages);
              continue;
            }

            for (const entry of bomEntries) {
              const requiredQty = Number(entry.quantity_per_unit) * Number(currentQuantity);
              await RawMaterial.updateOne(
                { _id: entry.raw_material._id },
                { $inc: { current_stock: -requiredQty } },
                { session }
              );
            }
          }

          const legacyId = await getNextSequence('manufacturing', session);

          const [record] = await Manufacturing.create(
            [
              {
                legacy_id: legacyId,
                item: itemDoc._id,
                quantity_manufactured: currentQuantity,
                batch_number,
                staff_name,
                manufacturing_date: new Date(manufacturing_date),
                manufacturing_time: normalizedTime,
                notes,
              },
            ],
            { session }
          );

          await Item.updateOne(
            { _id: itemDoc._id },
            { $inc: { current_stock: currentQuantity } },
            { session }
          );

          createdRecords.push({
            legacy_id: record.legacy_id,
            item_id: itemDoc.legacy_id,
            item_name: itemDoc.name,
            quantity_manufactured: currentQuantity,
          });
        }

        if (shortages.length > 0) {
          const message =
            'Insufficient raw materials: ' +
            shortages
              .map(
                (s) =>
                  `${s.item_name} - ${s.raw_material_name} (need ${s.required} ${s.unit}, have ${s.available} ${s.unit})`
              )
              .join(', ');
          const error = new Error(message);
          error.statusCode = 400;
          throw error;
        }
      });

      res.status(201).json({
        success: true,
        message: `Successfully created ${createdRecords.length} manufacturing record(s)`,
        data: createdRecords.map((record) => ({
          id: record.legacy_id,
          item_id: record.item_id,
          item_name: record.item_name,
          quantity_manufactured: record.quantity_manufactured,
        })),
        batch_number,
        staff_name,
        manufacturing_date,
        manufacturing_time: normalizedTime,
        notes,
      });
    } catch (error) {
      console.error('Error creating manufacturing record:', error);
      const status = error.statusCode === 400 ? 400 : 500;
      res.status(status).json({ success: false, error: error.message || 'Failed to create manufacturing record' });
    } finally {
      session.endSession();
    }
  }
);

// Update manufacturing record
router.put(
  '/:id',
  [
    body('item_id').optional().isInt({ min: 1 }).withMessage('Valid item ID is required'),
    body('quantity_manufactured').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('batch_number').optional().notEmpty().withMessage('Batch number cannot be empty'),
    body('staff_name').optional().notEmpty().withMessage('Staff name cannot be empty'),
    body('manufacturing_date').optional().isISO8601().withMessage('Valid manufacturing date is required'),
    body('manufacturing_time')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Valid time format is required (HH:MM)'),
  ],
  async (req, res) => {
    const session = await mongoose.startSession();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const numericId = Number(req.params.id);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ success: false, error: 'Invalid manufacturing record ID' });
      }

      const currentRecord = await Manufacturing.findOne({ legacy_id: numericId })
        .populate('item')
        .session(session);

      if (!currentRecord) {
        return res.status(404).json({ success: false, error: 'Manufacturing record not found' });
      }

      const updates = {};
      const {
        item_id,
        quantity_manufactured,
        batch_number,
        staff_name,
        manufacturing_date,
        manufacturing_time,
        notes,
      } = req.body;

      if (
        item_id === undefined &&
        quantity_manufactured === undefined &&
        batch_number === undefined &&
        staff_name === undefined &&
        manufacturing_date === undefined &&
        manufacturing_time === undefined &&
        notes === undefined
      ) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }

      if (batch_number !== undefined) updates.batch_number = batch_number;
      if (staff_name !== undefined) updates.staff_name = staff_name;
      if (manufacturing_date !== undefined) updates.manufacturing_date = new Date(manufacturing_date);
      if (manufacturing_time !== undefined) updates.manufacturing_time = manufacturing_time;
      if (notes !== undefined) updates.notes = notes;

      await session.withTransaction(async () => {
        let itemDoc = currentRecord.item;
        if (item_id !== undefined && item_id !== currentRecord.item.legacy_id) {
          const newItem = await Item.findOne({ legacy_id: Number(item_id) }).session(session);
          if (!newItem) {
            throw new Error('New item not found');
          }
          itemDoc = newItem;
          updates.item = newItem._id;
        }

        if (quantity_manufactured !== undefined) {
          const quantityDiff = Number(quantity_manufactured) - currentRecord.quantity_manufactured;
          if (quantityDiff !== 0) {
            await Item.updateOne(
              { _id: itemDoc._id },
              { $inc: { current_stock: quantityDiff } },
              { session }
            );
            updates.quantity_manufactured = Number(quantity_manufactured);
          }
        }

        await Manufacturing.updateOne({ _id: currentRecord._id }, updates, { session });
      });

      const updatedRecord = await Manufacturing.findOne({ legacy_id: numericId })
        .populate('item', 'name sku legacy_id')
        .lean();

      res.json({
        success: true,
        message: 'Manufacturing record updated successfully',
        data: formatManufacturingRecord(updatedRecord),
      });
    } catch (error) {
      console.error('Error updating manufacturing record:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to update manufacturing record' });
    } finally {
      session.endSession();
    }
  }
);

// Delete manufacturing record
router.delete('/:id', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const numericId = Number(req.params.id);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid manufacturing record ID' });
    }

    const record = await Manufacturing.findOne({ legacy_id: numericId })
      .populate('item')
      .session(session);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Manufacturing record not found' });
    }

    await session.withTransaction(async () => {
      await Manufacturing.deleteOne({ _id: record._id }, { session });
      await Item.updateOne(
        { _id: record.item._id },
        { $inc: { current_stock: -record.quantity_manufactured } },
        { session }
      );
    });

    res.json({ success: true, message: 'Manufacturing record deleted successfully' });
  } catch (error) {
    console.error('Error deleting manufacturing record:', error);
    res.status(500).json({ success: false, error: 'Failed to delete manufacturing record' });
  } finally {
    session.endSession();
  }
});

export default router;
