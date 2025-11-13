import express from 'express';
import { body, validationResult } from 'express-validator';
import RawMaterial from '../models/RawMaterial.js';
import getNextSequence from '../utils/getNextSequence.js';

const router = express.Router();

// Get all raw materials
router.get('/', async (_req, res) => {
  try {
    const materials = await RawMaterial.find().sort({ created_at: -1 });
    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Error fetching raw materials:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch raw materials' });
  }
});

// Get raw material by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid raw material ID' });
    }

    const material = await RawMaterial.findOne({ legacy_id: numericId });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Raw material not found' });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    console.error('Error fetching raw material:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch raw material' });
  }
});

// Create new raw material
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('current_stock').isDecimal({ decimal_digits: '0,2' }).withMessage('Current stock must be a valid decimal'),
    body('unit').notEmpty().withMessage('Unit is required'),
    body('min_stock').isDecimal({ decimal_digits: '0,2' }).withMessage('Minimum stock must be a valid decimal'),
    body('price_per_unit').isDecimal({ decimal_digits: '0,2' }).withMessage('Price per unit must be a valid decimal'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        name,
        description,
        current_stock = 0,
        unit,
        min_stock = 0,
        price_per_unit,
        supplier,
        status = 'Adequate',
      } = req.body;

      const legacyId = await getNextSequence('raw_materials');

      const material = await RawMaterial.create({
        legacy_id: legacyId,
        name,
        description,
        current_stock: Number(current_stock) || 0,
        unit,
        min_stock: Number(min_stock) || 0,
        price_per_unit: Number(price_per_unit),
        supplier,
        status,
      });

      res.status(201).json({
        success: true,
        message: 'Raw material created successfully',
        data: material.toJSON(),
      });
    } catch (error) {
      console.error('Error creating raw material:', error);
      res.status(500).json({ success: false, error: 'Failed to create raw material' });
    }
  }
);

// Update raw material
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('current_stock').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Current stock must be a valid decimal'),
    body('unit').optional().notEmpty().withMessage('Unit cannot be empty'),
    body('min_stock').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Minimum stock must be a valid decimal'),
    body('price_per_unit').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Price per unit must be a valid decimal'),
    body('status').optional().isIn(['Adequate', 'Low', 'Critical']).withMessage('Invalid status'),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const numericId = Number(id);

      if (Number.isNaN(numericId)) {
        return res.status(400).json({ success: false, error: 'Invalid raw material ID' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const numericFields = ['current_stock', 'min_stock', 'price_per_unit'];
      const updates = {};

      Object.entries(req.body).forEach(([key, value]) => {
        if (numericFields.includes(key)) {
          updates[key] = value !== undefined && value !== null ? Number(value) : value;
        } else {
          updates[key] = value;
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }

      const material = await RawMaterial.findOneAndUpdate({ legacy_id: numericId }, updates, {
        new: true,
        runValidators: true,
      });

      if (!material) {
        return res.status(404).json({ success: false, error: 'Raw material not found' });
      }

      res.json({
        success: true,
        message: 'Raw material updated successfully',
        data: material.toJSON(),
      });
    } catch (error) {
      console.error('Error updating raw material:', error);
      res.status(500).json({ success: false, error: 'Failed to update raw material' });
    }
  }
);

// Delete raw material
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid raw material ID' });
    }

    const result = await RawMaterial.findOneAndDelete({ legacy_id: numericId });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Raw material not found' });
    }

    res.json({ success: true, message: 'Raw material deleted successfully' });
  } catch (error) {
    console.error('Error deleting raw material:', error);
    res.status(500).json({ success: false, error: 'Failed to delete raw material' });
  }
});

// Update stock
router.patch(
  '/:id/stock',
  [
    body('quantity').isDecimal({ decimal_digits: '0,2' }).withMessage('Quantity must be a valid decimal'),
    body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set'),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { quantity, operation } = req.body;
      const numericId = Number(id);

      if (Number.isNaN(numericId)) {
        return res.status(400).json({ success: false, error: 'Invalid raw material ID' });
      }

      const material = await RawMaterial.findOne({ legacy_id: numericId });

      if (!material) {
        return res.status(404).json({ success: false, error: 'Raw material not found' });
      }

      const qty = Number(quantity);
      const previousStock = material.current_stock || 0;
      let newStock = previousStock;

      switch (operation) {
        case 'add':
          newStock = previousStock + qty;
          break;
        case 'subtract':
          newStock = Math.max(0, previousStock - qty);
          break;
        case 'set':
          newStock = Math.max(0, qty);
          break;
        default:
          return res.status(400).json({ success: false, error: 'Invalid operation' });
      }

      material.current_stock = newStock;
      await material.save();

      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: {
          id: material.legacy_id,
          previous_stock: previousStock,
          new_stock: newStock,
          operation,
          quantity: qty,
        },
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ success: false, error: 'Failed to update stock' });
    }
  }
);

export default router;
