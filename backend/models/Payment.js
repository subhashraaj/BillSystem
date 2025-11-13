import { Schema, model, Types } from 'mongoose';

const paymentSchema = new Schema(
  {
    legacy_id: {
      type: Number,
      unique: true,
      index: true,
      required: true,
    },
    payment_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoice: {
      type: Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    customer: {
      type: Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    payment_date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_method: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    reference_number: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

paymentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret.legacy_id;
    delete ret.legacy_id;
    if (ret.invoice && ret.invoice.legacy_id) {
      ret.invoice_id = ret.invoice.legacy_id;
    }
    if (ret.customer && ret.customer.legacy_id) {
      ret.customer_id = ret.customer.legacy_id;
    }
    delete ret._id;
  },
});

export default model('Payment', paymentSchema);

