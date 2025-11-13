import { Schema, model, Types } from 'mongoose';

const invoiceItemSchema = new Schema(
  {
    item: {
      type: Types.ObjectId,
      ref: 'Item',
      required: true,
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

invoiceSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret.legacy_id;
    delete ret.legacy_id;
    if (ret.customer && ret.customer.legacy_id) {
      ret.customer_id = ret.customer.legacy_id;
    }
    if (Array.isArray(ret.items)) {
      ret.items = ret.items.map((item) => {
        if (item?.item && item.item.legacy_id) {
          return {
            ...item,
            item_id: item.item.legacy_id,
          };
        }
        return item;
      });
    }
    delete ret._id;
  },
});

export default model('Invoice', invoiceSchema);

