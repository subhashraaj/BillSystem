const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.execute(`
      SELECT i.*, c.name as customer_name, c.email as customer_email,
             COUNT(ii.id) as item_count
      FROM invoices i 
      JOIN customers c ON i.customer_id = c.id 
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      GROUP BY i.id
      ORDER BY i.invoice_date DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// Get invoice by ID with items
router.get('/:id', async (req, res) => {
  try {
    // Get invoice details
    const [invoiceRows] = await req.db.execute(`
      SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address
      FROM invoices i 
      JOIN customers c ON i.customer_id = c.id 
      WHERE i.id = ?
    `, [req.params.id]);
    
    if (invoiceRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    // Get invoice items
    const [itemRows] = await req.db.execute(`
      SELECT ii.*, it.name as item_name, it.sku
      FROM invoice_items ii
      JOIN items it ON ii.item_id = it.id
      WHERE ii.invoice_id = ?
    `, [req.params.id]);
    
    const invoice = invoiceRows[0];
    invoice.items = itemRows;
    
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

// Create new invoice
router.post('/', [
  body('customer_id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
  body('invoice_date').isISO8601().withMessage('Valid invoice date is required'),
  body('due_date').optional().isISO8601().withMessage('Valid due date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.item_id').isInt({ min: 1 }).withMessage('Valid item ID is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required for each item'),
  body('tax_rate').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Tax rate must be a valid decimal')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { customer_id, invoice_date, due_date, items, tax_rate = 0, notes } = req.body;
    
    // Verify customer exists
    const [customerRows] = await req.db.execute(
      'SELECT id, name FROM customers WHERE id = ?',
      [customer_id]
    );
    
    if (customerRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Customer not found' });
    }
    
    // Generate invoice number
    const [countRows] = await req.db.execute('SELECT COUNT(*) as count FROM invoices');
    const invoiceNumber = `INV-${String(countRows[0].count + 1).padStart(3, '0')}`;
    
    // Calculate totals
    let subtotal = 0;
    const processedItems = [];
    
    for (const item of items) {
      const [itemRows] = await req.db.execute(
        'SELECT id, name, price FROM items WHERE id = ?',
        [item.item_id]
      );
      
      if (itemRows.length === 0) {
        return res.status(400).json({ success: false, error: `Item with ID ${item.item_id} not found` });
      }
      
      const itemData = itemRows[0];
      const totalPrice = itemData.price * item.quantity;
      subtotal += totalPrice;
      
      processedItems.push({
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: itemData.price,
        total_price: totalPrice
      });
    }
    
    const taxAmount = subtotal * (tax_rate / 100);
    const totalAmount = subtotal + taxAmount;
    
    // Create invoice
    const [invoiceResult] = await req.db.execute(
      'INSERT INTO invoices (invoice_number, customer_id, invoice_date, due_date, subtotal, tax_amount, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [invoiceNumber, customer_id, invoice_date, due_date, subtotal, taxAmount, totalAmount, notes]
    );
    
    const invoiceId = invoiceResult.insertId;
    
    // Create invoice items
    for (const item of processedItems) {
      await req.db.execute(
        'INSERT INTO invoice_items (invoice_id, item_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [invoiceId, item.item_id, item.quantity, item.unit_price, item.total_price]
      );
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Invoice created successfully',
      data: { 
        id: invoiceId,
        invoice_number: invoiceNumber,
        customer_id,
        customer_name: customerRows[0].name,
        invoice_date,
        due_date,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        items: processedItems
      }
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to create invoice' });
  }
});

// Update invoice
router.put('/:id', [
  body('customer_id').optional().isInt({ min: 1 }).withMessage('Valid customer ID is required'),
  body('invoice_date').optional().isISO8601().withMessage('Valid invoice date is required'),
  body('due_date').optional().isISO8601().withMessage('Valid due date is required'),
  body('status').optional().isIn(['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']).withMessage('Invalid status'),
  body('tax_rate').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Tax rate must be a valid decimal')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { customer_id, invoice_date, due_date, status, tax_rate, notes } = req.body;
    
    // Build dynamic query
    const updates = [];
    const values = [];
    
    if (customer_id !== undefined) { updates.push('customer_id = ?'); values.push(customer_id); }
    if (invoice_date !== undefined) { updates.push('invoice_date = ?'); values.push(invoice_date); }
    if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    const [result] = await req.db.execute(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    res.json({ success: true, message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to update invoice' });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await req.db.execute(
      'DELETE FROM invoices WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to delete invoice' });
  }
});

module.exports = router;
