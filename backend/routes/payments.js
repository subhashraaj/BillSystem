import express from 'express';
import { body, validationResult } from 'express-validator';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import getNextSequence from '../utils/getNextSequence.js';

const router = express.Router();

const formatDate = (value) =>
  value ? new Date(value).toISOString().split('T')[0] : null;

const formatPayment = (payment) => {
  const invoice = payment.invoice || {};
  const customer = payment.customer || {};

  return {
    id: payment.legacy_id,
    payment_number: payment.payment_number,
    invoice_id: invoice.legacy_id,
    invoice_number: invoice.invoice_number,
    invoice_total: invoice.total_amount,
    customer_id: customer.legacy_id,
    customer_name: customer.name,
    customer_email: customer.email,
    payment_date: formatDate(payment.payment_date),
    amount: payment.amount,
    payment_method: payment.payment_method,
    status: payment.status,
    reference_number: payment.reference_number,
    notes: payment.notes,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  };
};

// Get all payments
router.get('/', async (_req, res) => {
  try {
    const payments = await Payment.find()
      .populate('invoice', 'legacy_id invoice_number total_amount')
      .populate('customer', 'legacy_id name email')
      .sort({ payment_date: -1 })
      .lean();

    res.json({ success: true, data: payments.map(formatPayment) });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const numericId = Number(req.params.id);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid payment ID' });
    }

    const payment = await Payment.findOne({ legacy_id: numericId })
      .populate('invoice', 'legacy_id invoice_number total_amount')
      .populate('customer', 'legacy_id name email')
      .lean();

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({ success: true, data: formatPayment(payment) });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment' });
  }
});

// Create new payment
router.post(
  '/',
  [
    body('invoice_id').isInt({ min: 1 }).withMessage('Valid invoice ID is required'),
    body('customer_id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
    body('payment_date').isISO8601().withMessage('Valid payment date is required'),
    body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal'),
    body('payment_method')
      .isIn(['Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Other'])
      .withMessage('Valid payment method is required'),
    body('status')
      .optional()
      .isIn(['Pending', 'Completed', 'Failed', 'Refunded'])
      .withMessage('Invalid status'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        invoice_id,
        customer_id,
        payment_date,
        amount,
        payment_method,
        status = 'Pending',
        reference_number,
        notes,
      } = req.body;

      const invoice = await Invoice.findOne({ legacy_id: Number(invoice_id) });
      if (!invoice) {
        return res.status(400).json({ success: false, error: 'Invoice not found' });
      }

      const customer = await Customer.findOne({ legacy_id: Number(customer_id) });
      if (!customer) {
        return res.status(400).json({ success: false, error: 'Customer not found' });
      }

      const legacyId = await getNextSequence('payments');
      const paymentNumber = `PAY-${String(legacyId).padStart(3, '0')}`;

      const payment = await Payment.create({
        legacy_id: legacyId,
        payment_number: paymentNumber,
        invoice: invoice._id,
        customer: customer._id,
        payment_date: new Date(payment_date),
        amount: Number(amount),
        payment_method,
        status,
        reference_number,
        notes,
      });

      if (status === 'Completed') {
        await Invoice.updateOne({ _id: invoice._id }, { status: 'Paid' });
        await Customer.updateOne(
          { _id: customer._id },
          { $inc: { balance: -Number(amount) } }
        );
      }

      const populated = await Payment.findById(payment._id)
        .populate('invoice', 'legacy_id invoice_number total_amount')
        .populate('customer', 'legacy_id name email')
        .lean();

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: formatPayment(populated),
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ success: false, error: 'Failed to create payment' });
    }
  }
);

// Update payment
router.put(
  '/:id',
  [
    body('invoice_id').optional().isInt({ min: 1 }).withMessage('Valid invoice ID is required'),
    body('customer_id').optional().isInt({ min: 1 }).withMessage('Valid customer ID is required'),
    body('payment_date').optional().isISO8601().withMessage('Valid payment date is required'),
    body('amount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal'),
    body('payment_method')
      .optional()
      .isIn(['Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Other'])
      .withMessage('Valid payment method is required'),
    body('status')
      .optional()
      .isIn(['Pending', 'Completed', 'Failed', 'Refunded'])
      .withMessage('Invalid status'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const numericId = Number(req.params.id);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ success: false, error: 'Invalid payment ID' });
      }

      const currentPayment = await Payment.findOne({ legacy_id: numericId })
        .populate('invoice')
        .populate('customer');

      if (!currentPayment) {
        return res.status(404).json({ success: false, error: 'Payment not found' });
      }

      const updates = {};
      const {
        invoice_id,
        customer_id,
        payment_date,
        amount,
        payment_method,
        status,
        reference_number,
        notes,
      } = req.body;

      if (invoice_id !== undefined) {
        const invoice = await Invoice.findOne({ legacy_id: Number(invoice_id) });
        if (!invoice) {
          return res.status(400).json({ success: false, error: 'Invoice not found' });
        }
        updates.invoice = invoice._id;
      }

      if (customer_id !== undefined) {
        const customer = await Customer.findOne({ legacy_id: Number(customer_id) });
        if (!customer) {
          return res.status(400).json({ success: false, error: 'Customer not found' });
        }
        updates.customer = customer._id;
      }

      if (payment_date !== undefined) updates.payment_date = new Date(payment_date);
      if (amount !== undefined) updates.amount = Number(amount);
      if (payment_method !== undefined) updates.payment_method = payment_method;
      if (status !== undefined) updates.status = status;
      if (reference_number !== undefined) updates.reference_number = reference_number;
      if (notes !== undefined) updates.notes = notes;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }

      const amountToUse =
        amount !== undefined ? Number(amount) : currentPayment.amount;

      if (status !== undefined && status !== currentPayment.status) {
        if (status === 'Completed' && currentPayment.status !== 'Completed') {
          await Invoice.updateOne(
            { _id: updates.invoice || currentPayment.invoice._id },
            { status: 'Paid' }
          );
          await Customer.updateOne(
            { _id: updates.customer || currentPayment.customer._id },
            { $inc: { balance: -amountToUse } }
          );
        } else if (currentPayment.status === 'Completed' && status !== 'Completed') {
          await Invoice.updateOne(
            { _id: updates.invoice || currentPayment.invoice._id },
            { status: 'Pending' }
          );
          await Customer.updateOne(
            { _id: updates.customer || currentPayment.customer._id },
            { $inc: { balance: currentPayment.amount } }
          );
        }
      }

      const payment = await Payment.findOneAndUpdate(
        { legacy_id: numericId },
        updates,
        { new: true, runValidators: true }
      )
        .populate('invoice', 'legacy_id invoice_number total_amount')
        .populate('customer', 'legacy_id name email')
        .lean();

      res.json({
        success: true,
        message: 'Payment updated successfully',
        data: formatPayment(payment),
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({ success: false, error: 'Failed to update payment' });
    }
  }
);

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const numericId = Number(req.params.id);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid payment ID' });
    }

    const payment = await Payment.findOne({ legacy_id: numericId })
      .populate('invoice')
      .populate('customer');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    await Payment.deleteOne({ _id: payment._id });

    if (payment.status === 'Completed') {
      await Invoice.updateOne(
        { _id: payment.invoice._id },
        { status: 'Pending' }
      );
      await Customer.updateOne(
        { _id: payment.customer._id },
        { $inc: { balance: payment.amount } }
      );
    }

    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete payment' });
  }
});

export default router;
