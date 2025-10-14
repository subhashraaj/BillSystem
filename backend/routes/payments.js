const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all payments
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.execute(`
      SELECT p.*, i.invoice_number, c.name as customer_name, c.email as customer_email
      FROM payments p 
      JOIN invoices i ON p.invoice_id = i.id 
      JOIN customers c ON p.customer_id = c.id 
      ORDER BY p.payment_date DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await req.db.execute(`
      SELECT p.*, i.invoice_number, i.total_amount as invoice_total, c.name as customer_name, c.email as customer_email
      FROM payments p 
      JOIN invoices i ON p.invoice_id = i.id 
      JOIN customers c ON p.customer_id = c.id 
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment' });
  }
});

// Create new payment
router.post('/', [
  body('invoice_id').isInt({ min: 1 }).withMessage('Valid invoice ID is required'),
  body('customer_id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
  body('payment_date').isISO8601().withMessage('Valid payment date is required'),
  body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal'),
  body('payment_method').isIn(['Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Other']).withMessage('Valid payment method is required'),
  body('status').optional().isIn(['Pending', 'Completed', 'Failed', 'Refunded']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { invoice_id, customer_id, payment_date, amount, payment_method, status = 'Pending', reference_number, notes } = req.body;
    
    // Verify invoice exists
    const [invoiceRows] = await req.db.execute(
      'SELECT id, invoice_number, total_amount FROM invoices WHERE id = ?',
      [invoice_id]
    );
    
    if (invoiceRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invoice not found' });
    }
    
    // Verify customer exists
    const [customerRows] = await req.db.execute(
      'SELECT id, name FROM customers WHERE id = ?',
      [customer_id]
    );
    
    if (customerRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Customer not found' });
    }
    
    // Generate payment number
    const [countRows] = await req.db.execute('SELECT COUNT(*) as count FROM payments');
    const paymentNumber = `PAY-${String(countRows[0].count + 1).padStart(3, '0')}`;
    
    // Create payment
    const [result] = await req.db.execute(
      'INSERT INTO payments (payment_number, invoice_id, customer_id, payment_date, amount, payment_method, status, reference_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [paymentNumber, invoice_id, customer_id, payment_date, amount, payment_method, status, reference_number, notes]
    );
    
    // If payment is completed, update invoice status and customer balance
    if (status === 'Completed') {
      // Update invoice status to Paid
      await req.db.execute(
        'UPDATE invoices SET status = ? WHERE id = ?',
        ['Paid', invoice_id]
      );
      
      // Update customer balance (subtract payment amount)
      await req.db.execute(
        'UPDATE customers SET balance = balance - ? WHERE id = ?',
        [amount, customer_id]
      );
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Payment created successfully',
      data: { 
        id: result.insertId,
        payment_number: paymentNumber,
        invoice_id,
        invoice_number: invoiceRows[0].invoice_number,
        customer_id,
        customer_name: customerRows[0].name,
        payment_date,
        amount,
        payment_method,
        status,
        reference_number,
        notes
      }
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
});

// Update payment
router.put('/:id', [
  body('invoice_id').optional().isInt({ min: 1 }).withMessage('Valid invoice ID is required'),
  body('customer_id').optional().isInt({ min: 1 }).withMessage('Valid customer ID is required'),
  body('payment_date').optional().isISO8601().withMessage('Valid payment date is required'),
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal'),
  body('payment_method').optional().isIn(['Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Other']).withMessage('Valid payment method is required'),
  body('status').optional().isIn(['Pending', 'Completed', 'Failed', 'Refunded']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { invoice_id, customer_id, payment_date, amount, payment_method, status, reference_number, notes } = req.body;
    
    // Get current payment
    const [currentRows] = await req.db.execute(
      'SELECT * FROM payments WHERE id = ?',
      [req.params.id]
    );
    
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    const currentPayment = currentRows[0];
    
    // Build dynamic query
    const updates = [];
    const values = [];
    
    if (invoice_id !== undefined) { updates.push('invoice_id = ?'); values.push(invoice_id); }
    if (customer_id !== undefined) { updates.push('customer_id = ?'); values.push(customer_id); }
    if (payment_date !== undefined) { updates.push('payment_date = ?'); values.push(payment_date); }
    if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
    if (payment_method !== undefined) { updates.push('payment_method = ?'); values.push(payment_method); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (reference_number !== undefined) { updates.push('reference_number = ?'); values.push(reference_number); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    // Update payment
    const [result] = await req.db.execute(
      `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Handle status changes
    if (status !== undefined && status !== currentPayment.status) {
      if (status === 'Completed' && currentPayment.status !== 'Completed') {
        // Mark invoice as paid and update customer balance
        await req.db.execute(
          'UPDATE invoices SET status = ? WHERE id = ?',
          ['Paid', invoice_id || currentPayment.invoice_id]
        );
        
        const paymentAmount = amount || currentPayment.amount;
        await req.db.execute(
          'UPDATE customers SET balance = balance - ? WHERE id = ?',
          [paymentAmount, customer_id || currentPayment.customer_id]
        );
      } else if (currentPayment.status === 'Completed' && status !== 'Completed') {
        // Revert invoice status and customer balance
        await req.db.execute(
          'UPDATE invoices SET status = ? WHERE id = ?',
          ['Pending', invoice_id || currentPayment.invoice_id]
        );
        
        await req.db.execute(
          'UPDATE customers SET balance = balance + ? WHERE id = ?',
          [currentPayment.amount, customer_id || currentPayment.customer_id]
        );
      }
    }
    
    res.json({ success: true, message: 'Payment updated successfully' });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment' });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    // Get current payment
    const [currentRows] = await req.db.execute(
      'SELECT * FROM payments WHERE id = ?',
      [req.params.id]
    );
    
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    const currentPayment = currentRows[0];
    
    // Delete payment
    const [result] = await req.db.execute(
      'DELETE FROM payments WHERE id = ?',
      [req.params.id]
    );
    
    // If payment was completed, revert invoice status and customer balance
    if (currentPayment.status === 'Completed') {
      await req.db.execute(
        'UPDATE invoices SET status = ? WHERE id = ?',
        ['Pending', currentPayment.invoice_id]
      );
      
      await req.db.execute(
        'UPDATE customers SET balance = balance + ? WHERE id = ?',
        [currentPayment.amount, currentPayment.customer_id]
      );
    }
    
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete payment' });
  }
});

module.exports = router;
