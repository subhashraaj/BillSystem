const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all items
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      'SELECT * FROM items ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch items' });
  }
});

// Get item by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      'SELECT * FROM items WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch item' });
  }
});

// Create new item
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('current_stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('price').isDecimal({ decimal_digits: '0,2' }).withMessage('Price must be a valid decimal'),
  body('cost').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Cost must be a valid decimal')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, sku, description, category, current_stock = 0, price, cost, status = 'In Stock' } = req.body;
    
    const [result] = await req.db.execute(
      'INSERT INTO items (name, sku, description, category, current_stock, price, cost, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, sku, description, category, current_stock, price, cost, status]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Item created successfully',
      data: { id: result.insertId, name, sku, description, category, current_stock, price, cost, status }
    });
  } catch (error) {
    console.error('Error creating item:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, error: 'SKU already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create item' });
    }
  }
});

// Update item
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('sku').optional().notEmpty().withMessage('SKU cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('current_stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('price').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Price must be a valid decimal'),
  body('cost').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Cost must be a valid decimal')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, sku, description, category, current_stock, price, cost, status } = req.body;
    
    // Build dynamic query
    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (sku !== undefined) { updates.push('sku = ?'); values.push(sku); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (current_stock !== undefined) { updates.push('current_stock = ?'); values.push(current_stock); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (cost !== undefined) { updates.push('cost = ?'); values.push(cost); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    const [result] = await req.db.execute(
      `UPDATE items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating item:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, error: 'SKU already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update item' });
    }
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await req.db.execute(
      'DELETE FROM items WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, error: 'Failed to delete item' });
  }
});

// Update stock
router.patch('/:id/stock', [
  body('quantity').isInt().withMessage('Quantity must be an integer'),
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
      'SELECT current_stock FROM items WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    let newStock;
    const currentStock = rows[0].current_stock;
    
    switch (operation) {
      case 'add':
        newStock = currentStock + quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, currentStock - quantity);
        break;
      case 'set':
        newStock = Math.max(0, quantity);
        break;
    }
    
    // Update stock
    const [result] = await req.db.execute(
      'UPDATE items SET current_stock = ? WHERE id = ?',
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
