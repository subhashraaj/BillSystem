import express from 'express';
import { body, validationResult } from 'express-validator';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Item from '../models/Item.js';
import getNextSequence from '../utils/getNextSequence.js';
import mongoose from 'mongoose';


const router = express.Router();

/* ---------------- FORMAT RESPONSE ---------------- */
const formatInvoice = (invoice) => {
  const customer = invoice.customer || {};

  return {
    id: invoice.legacy_id,
    invoice_number: invoice.invoice_number,
    customer_city: customer.city,
    customer_id: customer.legacy_id,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    customer_address: customer.address,

    invoice_date: invoice.invoice_date
      ? new Date(invoice.invoice_date).toISOString().split('T')[0]
      : null,

    due_date: invoice.due_date
      ? new Date(invoice.due_date).toISOString().split('T')[0]
      : null,

    subtotal: invoice.subtotal,
    tax_amount: invoice.tax_amount,
    total_amount: invoice.total_amount,
    status: invoice.status,
    notes: invoice.notes,

    item_count: Array.isArray(invoice.items) ? invoice.items.length : 0,

    items: Array.isArray(invoice.items)
      ? invoice.items.map((item) => ({
        item_id: item.item_id,
        item_name: item.item_name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price, // invoice rate
        total_price: item.total_price,
      }))
      : [],

    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
  };
};

/* ---------------- GET ALL INVOICES ---------------- */
router.get('/', async (_req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('customer', 'name email phone address city legacy_id')
      .sort({ invoice_date: -1 })
      .lean();

    res.json({ success: true, data: invoices.map(formatInvoice) });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

/* ---------------- GET INVOICE BY ID ---------------- */
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

/* ---------------- CREATE INVOICE ---------------- */
router.post(
  '/',
  [
    body('customer_id').isInt({ min: 1 }),
    body('invoice_date').isISO8601(),
    body('due_date').optional().isISO8601(),

    body('items').isArray({ min: 1 }),
    body('items.*.item_id').isInt({ min: 1 }),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.temp_rate')
      .optional()
      .isDecimal({ decimal_digits: '0,2' }),

    body('tax_rate').optional().isDecimal({ decimal_digits: '0,2' }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        customer_id,
        invoice_date,
        due_date,
        items,
        tax_rate = 0,
        notes,
      } = req.body;

      /* -------- Validate customer -------- */
      const customer = await Customer.findOne({ legacy_id: Number(customer_id) });
      if (!customer) {
        return res.status(400).json({ success: false, error: 'Customer not found' });
      }

      /* -------- Fetch items -------- */
      const itemIds = items.map((i) => Number(i.item_id));
      const itemDocs = await Item.find({ legacy_id: { $in: itemIds } });

      if (itemDocs.length !== itemIds.length) {
        return res.status(400).json({ success: false, error: 'One or more items not found' });
      }

      const itemMap = new Map(itemDocs.map((doc) => [doc.legacy_id, doc]));

      /* -------- Process invoice items -------- */
      let subtotal = 0;
      const processedItems = [];

      for (const i of items) {
        const itemDoc = itemMap.get(Number(i.item_id));
        const quantity = Number(i.quantity);

        // ✅ TEMP RATE LOGIC
        const unitPrice =
          i.temp_rate !== undefined && i.temp_rate !== null
            ? Number(i.temp_rate)
            : Number(itemDoc.price);

        if (unitPrice <= 0) {
          return res.status(400).json({
            success: false,
            error: `Invalid rate for item ${itemDoc.name}`,
          });
        }

        const totalPrice = unitPrice * quantity;
        subtotal += totalPrice;

        processedItems.push({
          item: itemDoc._id,
          item_id: itemDoc.legacy_id,
          item_name: itemDoc.name,
          sku: itemDoc.sku,
          quantity,
          unit_price: unitPrice, // invoice-specific rate
          total_price: totalPrice,
        });
      }

      /* -------- Tax & totals -------- */
      const taxAmount = subtotal * (Number(tax_rate) / 100);
      const totalAmount = subtotal + taxAmount;

      /* -------- Invoice numbering -------- */
      const legacyId = await getNextSequence('invoices');
      const invoiceNumber = `ARR-${String(legacyId).padStart(4, '0')}`;

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const [invoice] = await Invoice.create(
          [{
            legacy_id: legacyId,
            invoice_number: invoiceNumber,
            customer: customer._id,
            invoice_date: new Date(invoice_date),
            due_date: due_date ? new Date(due_date) : undefined,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            notes,
            status: 'Draft',
            items: processedItems,
          }],
          { session }
        );

        await Customer.findByIdAndUpdate(
          customer._id,
          { $inc: { balance: totalAmount } },
          { session }
        );
      
        await session.commitTransaction();
        session.endSession();
      
        const populated = await Invoice.findById(invoice._id)
          .populate('customer', 'name email phone address city legacy_id')
          .populate('items.item', 'name sku legacy_id')
          .lean();
      
        return res.status(201).json({
          success: true,
          message: 'Invoice created successfully',
          data: formatInvoice(populated),
        });
      
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
      
        console.error('Error creating invoice:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create invoice',
        });
      }

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

/* ---------------- UPDATE INVOICE ---------------- */
router.put('/:id', async (req, res) => {
  try {
    const numericId = Number(req.params.id);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid invoice ID' });
    }

    const updates = {};
    const { customer_id, invoice_date, due_date, status, notes } = req.body;

    if (customer_id) {
      const customer = await Customer.findOne({ legacy_id: Number(customer_id) });
      if (!customer) {
        return res.status(400).json({ success: false, error: 'Customer not found' });
      }
      updates.customer = customer._id;
    }

    if (invoice_date) updates.invoice_date = new Date(invoice_date);
    if (due_date) updates.due_date = new Date(due_date);
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const invoice = await Invoice.findOneAndUpdate(
      { legacy_id: numericId },
      updates,
      { new: true }
    )
      .populate('customer', 'name phone email legacy_id')
      .lean();

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data: formatInvoice(invoice) });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to update invoice' });
  }
});

/* ---------------- DELETE INVOICE ---------------- */
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
