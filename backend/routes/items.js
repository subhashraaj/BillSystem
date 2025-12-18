import express from 'express';
import { body, validationResult } from 'express-validator';
import Item from '../models/Item.js';
import getNextSequence from '../utils/getNextSequence.js';

const router = express.Router();

// Get all items
router.get('/', async (_req, res) => {
  try {
    const items = await Item.find().sort({ created_at: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch items' });
  }
});

// Get item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid item ID' });
    }

    const item = await Item.findOne({ legacy_id: numericId });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch item' });
  }
});

// Create new item
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('gram').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Gram required must be a valid decimal'),
    body('current_stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('price').isDecimal({ decimal_digits: '0,2' }).withMessage('Price must be a valid decimal'),
    body('cost').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Cost must be a valid decimal'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        name,
        gram = 0,
        sku,
        description,
        category,
        current_stock,
        price,
        cost = 0,
        status = 'In Stock',
      } = req.body;

      const legacyId = await getNextSequence('items');

      const item = await Item.create({
        legacy_id: legacyId,
        name,
        gram: Number(gram) || 0,
        sku,
        description,
        category,
        current_stock: Number(current_stock) || 0,
        price: Number(price),
        cost: Number(cost) || 0,
        status,
      });

      res.status(201).json({
        success: true,
        message: 'Item created successfully',
        data: item.toJSON(),
      });
    } catch (error) {
      console.error('Error creating item:', error);
      if (error.code === 11000) {
        res.status(400).json({ success: false, error: 'SKU already exists' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to create item' });
      }
    }
  }
);

// Update item
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('sku').optional().notEmpty().withMessage('SKU cannot be empty'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty'),
    body('gram').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Gram required must be a valid decimal'),
    body('current_stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('price').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Price must be a valid decimal'),
    body('cost').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Cost must be a valid decimal'),
    body('status').optional().isIn(['In Stock', 'Low Stock', 'Critical', 'Out of Stock']).withMessage('Invalid status'),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const numericId = Number(id);

      if (Number.isNaN(numericId)) {
        return res.status(400).json({ success: false, error: 'Invalid item ID' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const updates = {};
      const numericFields = ['gram', 'current_stock', 'price', 'cost'];

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

      const item = await Item.findOneAndUpdate({ legacy_id: numericId }, updates, {
        new: true,
        runValidators: true,
      });

      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      res.json({ success: true, message: 'Item updated successfully', data: item.toJSON() });
    } catch (error) {
      console.error('Error updating item:', error);
      if (error.code === 11000) {
        res.status(400).json({ success: false, error: 'SKU already exists' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update item' });
      }
    }
  }
);

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid item ID' });
    }

    const result = await Item.findOneAndDelete({ legacy_id: numericId });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, error: 'Failed to delete item' });
  }
});

// Update stock
router.patch(
  '/:id/stock',
  [
    body('quantity').isInt().withMessage('Quantity must be an integer'),
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
        return res.status(400).json({ success: false, error: 'Invalid item ID' });
      }

      const item = await Item.findOne({ legacy_id: numericId });

      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      const qty = Number(quantity);
      const previousStock = item.current_stock || 0;
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

      item.current_stock = newStock;
      await item.save();

      res.json({
        success: true,
        message: 'Stock updated successfully',
        data: {
          id: item.legacy_id,
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
