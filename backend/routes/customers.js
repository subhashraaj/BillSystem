import express from 'express';
import { body, validationResult } from 'express-validator';
import Customer from '../models/Customer.js';
import getNextSequence from '../utils/getNextSequence.js';

const router = express.Router();

const normalizeOptional = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return value;
};

// Get all customers
router.get('/', async (_req, res) => {
  try {
    const customers = await Customer.find().sort({ created_at: -1 });
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid customer ID' });
    }

    const customer = await Customer.findOne({ legacy_id: numericId });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone')
      .optional()
      .custom((value) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return true;
        return String(value).trim().length >= 10;
      })
      .withMessage('Phone must be at least 10 characters'),
    body('mobile_number')
      .optional()
      .custom((value) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return true;
        return String(value).trim().length >= 10;
      })
      .withMessage('Mobile number must be at least 10 characters'),
    body('city')
      .optional()
      .custom((value) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return true;
        return String(value).trim().length >= 2;
      })
      .withMessage('City must be at least 2 characters'),
    body('state')
      .optional()
      .custom((value) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return true;
        return String(value).trim().length >= 2;
      })
      .withMessage('State must be at least 2 characters'),
    body('country')
      .optional()
      .custom((value) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return true;
        return String(value).trim().length >= 2;
      })
      .withMessage('Country must be at least 2 characters'),
    body('gst_number')
      .optional()
      .custom((value) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return true;
        return String(value).trim().length === 15;
      })
      .withMessage('GST number must be exactly 15 characters'),
    body('balance')
      .optional()
      .custom((value) => {
        if (value === '' || value === null || value === undefined) return true;
        const num = parseFloat(value);
        return !Number.isNaN(num) && Number.isFinite(num);
      })
      .withMessage('Balance must be a valid number'),
    body('opening_balance')
      .optional()
      .custom((value) => {
        if (value === '' || value === null || value === undefined) return true;
        const num = parseFloat(value);
        return !Number.isNaN(num) && Number.isFinite(num);
      })
      .withMessage('Opening balance must be a valid number'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg).join(', ');
        return res.status(400).json({
          success: false,
          error: errorMessages,
          errors: errors.array(),
        });
      }

      const {
        name,
        phone,
        mobile_number,
        city,
        state,
        country,
        gst_number,
        balance,
        opening_balance,
      } = req.body;

      const legacyId = await getNextSequence('customers');

      const customer = await Customer.create({
        legacy_id: legacyId,
        name: name.trim(),
        phone: normalizeOptional(phone),
        mobile_number: normalizeOptional(mobile_number),
        city: normalizeOptional(city),
        state: normalizeOptional(state),
        country: normalizeOptional(country),
        gst_number: normalizeOptional(gst_number),
        balance:
          balance !== undefined && balance !== null && balance !== ''
            ? Number(balance)
            : 0,
        opening_balance:
          opening_balance !== undefined && opening_balance !== null && opening_balance !== ''
            ? Number(opening_balance)
            : 0,
      });

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer.toJSON(),
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create customer',
      });
    }
  }
);

// Update customer
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isLength({ min: 10 }).withMessage('Phone must be at least 10 characters'),
    body('mobile_number').optional().isLength({ min: 10 }).withMessage('Mobile number must be at least 10 characters'),
    body('city').optional().isLength({ min: 2 }).withMessage('City must be at least 2 characters'),
    body('state').optional().isLength({ min: 2 }).withMessage('State must be at least 2 characters'),
    body('country').optional().isLength({ min: 2 }).withMessage('Country must be at least 2 characters'),
    body('gst_number')
      .optional()
      .isLength({ min: 15, max: 15 })
      .withMessage('GST number must be exactly 15 characters'),
    body('balance').optional().isDecimal().withMessage('Balance must be a valid number'),
    body('opening_balance').optional().isDecimal().withMessage('Opening balance must be a valid number'),
    body('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status'),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const numericId = Number(id);

      if (Number.isNaN(numericId)) {
        return res.status(400).json({ success: false, error: 'Invalid customer ID' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const updatePayload = {};
      const allowedFields = [
        'name',
        'email',
        'phone',
        'mobile_number',
        'address',
        'city',
        'state',
        'country',
        'gst_number',
        'balance',
        'opening_balance',
        'status',
      ];

      allowedFields.forEach((field) => {
        if (field in req.body) {
          const value = req.body[field];
          updatePayload[field] = ['balance', 'opening_balance'].includes(field) && value !== undefined
            ? Number(value)
            : normalizeOptional(value);
        }
      });

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }

      const result = await Customer.findOneAndUpdate({ legacy_id: numericId }, updatePayload, {
        new: true,
        runValidators: true,
      });

      if (!result) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }

      res.json({ success: true, message: 'Customer updated successfully', data: result.toJSON() });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ success: false, error: 'Failed to update customer' });
    }
  }
);

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return res.status(400).json({ success: false, error: 'Invalid customer ID' });
    }

    const result = await Customer.findOneAndDelete({ legacy_id: numericId });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, error: 'Failed to delete customer' });
  }
});

export default router;
