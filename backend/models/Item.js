import { Schema, model } from 'mongoose';

const itemSchema = new Schema(
  {
    legacy_id: {
      type: Number,
      unique: true,
      index: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gram: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      uppercase: true,
    },
    current_stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Critical', 'Out of Stock'],
      default: 'In Stock',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

itemSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret.legacy_id;
    delete ret.legacy_id;
    delete ret._id;
  },
});

export default model('Item', itemSchema);

