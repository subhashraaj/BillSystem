const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Phone must be at least 10 characters'),
  body('mobile_number').optional().isLength({ min: 10 }).withMessage('Mobile number must be at least 10 characters'),
  body('city').optional().isLength({ min: 2 }).withMessage('City must be at least 2 characters'),
  body('state').optional().isLength({ min: 2 }).withMessage('State must be at least 2 characters'),
  body('country').optional().isLength({ min: 2 }).withMessage('Country must be at least 2 characters'),
  body('gst_number').optional().isLength({ min: 15, max: 15 }).withMessage('GST number must be exactly 15 characters'),
  body('balance').optional().isDecimal().withMessage('Balance must be a valid number'),
  body('opening_balance').optional().isDecimal().withMessage('Opening balance must be a valid number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      name, 
      email = null, 
      phone, 
      mobile_number,
      city,
      state,
      country,
      gst_number,
      balance = 0, 
      opening_balance = 0
    } = req.body;
    
    const [result] = await req.db.execute(
      'INSERT INTO customers (name, email, phone, mobile_number, address, city, state, country, gst_number, balance, opening_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, mobile_number, '', city, state, country, gst_number, balance, opening_balance, 'Active']
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Customer created successfully',
      data: { 
        id: result.insertId, 
        name, 
        email, 
        phone, 
        mobile_number,
        address: '',
        city,
        state,
        country,
        gst_number,
        balance, 
        opening_balance,
        status: 'Active'
      }
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, error: 'Duplicate entry' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create customer' });
    }
  }
});

// Update customer
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Phone must be at least 10 characters'),
  body('mobile_number').optional().isLength({ min: 10 }).withMessage('Mobile number must be at least 10 characters'),
  body('city').optional().isLength({ min: 2 }).withMessage('City must be at least 2 characters'),
  body('state').optional().isLength({ min: 2 }).withMessage('State must be at least 2 characters'),
  body('country').optional().isLength({ min: 2 }).withMessage('Country must be at least 2 characters'),
  body('gst_number').optional().isLength({ min: 15, max: 15 }).withMessage('GST number must be exactly 15 characters'),
  body('balance').optional().isDecimal().withMessage('Balance must be a valid number'),
  body('opening_balance').optional().isDecimal().withMessage('Opening balance must be a valid number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      name, 
      email, 
      phone, 
      mobile_number,
      address, 
      city,
      state,
      country,
      gst_number,
      balance, 
      opening_balance,
      status 
    } = req.body;
    
    // Build dynamic query
    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (mobile_number !== undefined) { updates.push('mobile_number = ?'); values.push(mobile_number); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    if (city !== undefined) { updates.push('city = ?'); values.push(city); }
    if (state !== undefined) { updates.push('state = ?'); values.push(state); }
    if (country !== undefined) { updates.push('country = ?'); values.push(country); }
    if (gst_number !== undefined) { updates.push('gst_number = ?'); values.push(gst_number); }
    if (balance !== undefined) { updates.push('balance = ?'); values.push(balance); }
    if (opening_balance !== undefined) { updates.push('opening_balance = ?'); values.push(opening_balance); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    const [result] = await req.db.execute(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.json({ success: true, message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, error: 'Email already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update customer' });
    }
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await req.db.execute(
      'DELETE FROM customers WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, error: 'Failed to delete customer' });
  }
});

module.exports = router;
