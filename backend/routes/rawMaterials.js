const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all raw materials
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      'SELECT * FROM raw_materials ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching raw materials:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch raw materials' });
  }
});

// Get raw material by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      'SELECT * FROM raw_materials WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Raw material not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching raw material:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch raw material' });
  }
});

// Create new raw material
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('current_stock').isDecimal({ decimal_digits: '0,2' }).withMessage('Current stock must be a valid decimal'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('min_stock').isDecimal({ decimal_digits: '0,2' }).withMessage('Minimum stock must be a valid decimal'),
  body('price_per_unit').isDecimal({ decimal_digits: '0,2' }).withMessage('Price per unit must be a valid decimal')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, current_stock = 0, unit, min_stock = 0, price_per_unit, supplier, status = 'Adequate' } = req.body;
    
    const [result] = await req.db.execute(
      'INSERT INTO raw_materials (name, description, current_stock, unit, min_stock, price_per_unit, supplier, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, current_stock, unit, min_stock, price_per_unit, supplier, status]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Raw material created successfully',
      data: { id: result.insertId, name, description, current_stock, unit, min_stock, price_per_unit, supplier, status }
    });
  } catch (error) {
    console.error('Error creating raw material:', error);
    res.status(500).json({ success: false, error: 'Failed to create raw material' });
  }
});

// Update raw material
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('current_stock').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Current stock must be a valid decimal'),
  body('unit').optional().notEmpty().withMessage('Unit cannot be empty'),
  body('min_stock').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Minimum stock must be a valid decimal'),
  body('price_per_unit').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Price per unit must be a valid decimal')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, current_stock, unit, min_stock, price_per_unit, supplier, status } = req.body;
    
    // Build dynamic query
    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (current_stock !== undefined) { updates.push('current_stock = ?'); values.push(current_stock); }
    if (unit !== undefined) { updates.push('unit = ?'); values.push(unit); }
    if (min_stock !== undefined) { updates.push('min_stock = ?'); values.push(min_stock); }
    if (price_per_unit !== undefined) { updates.push('price_per_unit = ?'); values.push(price_per_unit); }
    if (supplier !== undefined) { updates.push('supplier = ?'); values.push(supplier); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    const [result] = await req.db.execute(
      `UPDATE raw_materials SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Raw material not found' });
    }
    
    res.json({ success: true, message: 'Raw material updated successfully' });
  } catch (error) {
    console.error('Error updating raw material:', error);
    res.status(500).json({ success: false, error: 'Failed to update raw material' });
  }
});

// Delete raw material
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await req.db.execute(
      'DELETE FROM raw_materials WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Raw material not found' });
    }
    
    res.json({ success: true, message: 'Raw material deleted successfully' });
  } catch (error) {
    console.error('Error deleting raw material:', error);
    res.status(500).json({ success: false, error: 'Failed to delete raw material' });
  }
});

// Update stock
router.patch('/:id/stock', [
  body('quantity').isDecimal({ decimal_digits: '0,2' }).withMessage('Quantity must be a valid decimal'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { quantity, operation } = req.body;
    
    // Get current stock
    const [rows] = await req.db.execute(
      'SELECT current_stock FROM raw_materials WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Raw material not found' });
    }
    
    let newStock;
    const currentStock = parseFloat(rows[0].current_stock);
    
    switch (operation) {
      case 'add':
        newStock = currentStock + parseFloat(quantity);
        break;
      case 'subtract':
        newStock = Math.max(0, currentStock - parseFloat(quantity));
        break;
      case 'set':
        newStock = Math.max(0, parseFloat(quantity));
        break;
    }
    
    // Update stock
    const [result] = await req.db.execute(
      'UPDATE raw_materials SET current_stock = ? WHERE id = ?',
      [newStock, req.params.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Stock updated successfully',
      data: { 
        id: req.params.id, 
        previous_stock: currentStock, 
        new_stock: newStock,
        operation,
        quantity 
      }
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, error: 'Failed to update stock' });
  }
});

module.exports = router;
