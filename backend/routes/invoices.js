import express from 'express';
import { body, validationResult } from 'express-validator';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Item from '../models/Item.js';
import getNextSequence from '../utils/getNextSequence.js';

const router = express.Router();

const formatInvoice = (invoice) => {
  const customer = invoice.customer || {};
  return {
    id: invoice.legacy_id,
    invoice_number: invoice.invoice_number,
    customer_id: customer.legacy_id,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    customer_address: customer.address,
    invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : null,
    due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : null,
    subtotal: invoice.subtotal,
    tax_amount: invoice.tax_amount,
    total_amount: invoice.total_amount,
    status: invoice.status,
    notes: invoice.notes,
    item_count: Array.isArray(invoice.items) ? invoice.items.length : 0,
    items: Array.isArray(invoice.items)
      ? invoice.items.map((item) => ({
          item_id: item.item?.legacy_id || item.item_id,
          item_name: item.item?.name,
          sku: item.item?.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))
      : [],
    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
  };
};

// Get all invoices
router.get('/', async (_req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('customer', 'name email legacy_id')
      .sort({ invoice_date: -1 })
      .lean();

    res.json({ success: true, data: invoices.map(formatInvoice) });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// Get invoice by ID with items
router.get('/:id', async (req, res) => {
  try {
    const numericId = Number(req.params.id);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid invoice ID' });
    }

    const invoice = await Invoice.findOne({ legacy_id: numericId })
      .populate('customer', 'name email phone address legacy_id')
      .populate('items.item', 'name sku legacy_id')
      .lean();

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data: formatInvoice(invoice) });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

// Create new invoice
router.post(
  '/',
  [
    body('customer_id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
    body('invoice_date').isISO8601().withMessage('Valid invoice date is required'),
    body('due_date').optional().isISO8601().withMessage('Valid due date is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.item_id').isInt({ min: 1 }).withMessage('Valid item ID is required for each item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required for each item'),
    body('tax_rate').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Tax rate must be a valid decimal'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { customer_id, invoice_date, due_date, items, tax_rate = 0, notes } = req.body;

      const customer = await Customer.findOne({ legacy_id: Number(customer_id) });
      if (!customer) {
        return res.status(400).json({ success: false, error: 'Customer not found' });
      }

      const itemIds = items.map((item) => Number(item.item_id));
      const itemDocs = await Item.find({ legacy_id: { $in: itemIds } });
      if (itemDocs.length !== itemIds.length) {
        const foundIds = itemDocs.map((doc) => doc.legacy_id);
        const missingIds = itemIds.filter((id) => !foundIds.includes(id));
        return res.status(400).json({
          success: false,
          error: `Item(s) not found: ${missingIds.join(', ')}`,
        });
      }

      const itemMap = new Map(itemDocs.map((doc) => [doc.legacy_id, doc]));
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const legacyId = Number(item.item_id);
        const itemDoc = itemMap.get(legacyId);
        const quantity = Number(item.quantity);
        const unitPrice = Number(itemDoc.price);
        const totalPrice = unitPrice * quantity;

        subtotal += totalPrice;
        processedItems.push({
          item: itemDoc._id,
          item_id: legacyId,
          item_name: itemDoc.name,
          sku: itemDoc.sku,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        });
      }

      const taxAmount = subtotal * (Number(tax_rate) / 100);
      const totalAmount = subtotal + taxAmount;

      const legacyId = await getNextSequence('invoices');
      const invoiceNumber = `ARR-${String(legacyId).padStart(4, '0')}`;

      const invoice = await Invoice.create({
        legacy_id: legacyId,
        invoice_number: invoiceNumber,
        customer: customer._id,
        invoice_date: new Date(invoice_date),
        due_date: due_date ? new Date(due_date) : undefined,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes,
        items: processedItems.map((item) => ({
          item: item.item,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
      });

      const populated = await Invoice.findById(invoice._id)
        .populate('customer', 'name email legacy_id')
        .populate('items.item', 'name sku legacy_id')
        .lean();

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: formatInvoice(populated),
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ success: false, error: 'Failed to create invoice' });
    }
  }
);

// Update invoice
router.put(
  '/:id',
  [
    body('customer_id').optional().isInt({ min: 1 }).withMessage('Valid customer ID is required'),
    body('invoice_date').optional().isISO8601().withMessage('Valid invoice date is required'),
    body('due_date').optional().isISO8601().withMessage('Valid due date is required'),
    body('status').optional().isIn(['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']).withMessage('Invalid status'),
    body('tax_rate').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Tax rate must be a valid decimal'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const numericId = Number(req.params.id);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ success: false, error: 'Invalid invoice ID' });
      }

      const updates = {};
      const { customer_id, invoice_date, due_date, status, notes } = req.body;

      if (customer_id !== undefined) {
        const customer = await Customer.findOne({ legacy_id: Number(customer_id) });
        if (!customer) {
          return res.status(400).json({ success: false, error: 'Customer not found' });
        }
        updates.customer = customer._id;
      }

      if (invoice_date !== undefined) updates.invoice_date = new Date(invoice_date);
      if (due_date !== undefined) updates.due_date = new Date(due_date);
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }

      const invoice = await Invoice.findOneAndUpdate({ legacy_id: numericId }, updates, {
        new: true,
        runValidators: true,
      })
        .populate('customer', 'name email legacy_id')
        .populate('items.item', 'name sku legacy_id')
        .lean();

      if (!invoice) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      res.json({
        success: true,
        message: 'Invoice updated successfully',
        data: formatInvoice(invoice),
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ success: false, error: 'Failed to update invoice' });
    }
  }
);

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const numericId = Number(req.params.id);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid invoice ID' });
    }

    const result = await Invoice.findOneAndDelete({ legacy_id: numericId });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to delete invoice' });
  }
});

export default router;
