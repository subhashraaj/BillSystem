import { Schema, model, Types } from 'mongoose';

const invoiceItemSchema = new Schema(
  {
    // Mongo reference (optional populate)
    item: {
      type: Types.ObjectId,
      ref: 'Item',
      required: true,
    },

    // Snapshot fields (stored permanently)
    item_id: {
      type: Number,
      required: true,
    },
    item_name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0,
    },
    total_price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const invoiceSchema = new Schema(
  {
    legacy_id: {
      type: Number,
      unique: true,
      index: true,
      required: true,
    },
    invoice_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer: {
      type: Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    invoice_date: {
      type: Date,
      required: true,
    },
    due_date: {
      type: Date,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_weight: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Draft',
    },
    notes: {
      type: String,
      trim: true,
    },
    items: [invoiceItemSchema],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

export default model('Invoice', invoiceSchema);
