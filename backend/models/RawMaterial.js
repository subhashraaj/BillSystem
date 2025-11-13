import { Schema, model } from 'mongoose';

const rawMaterialSchema = new Schema(
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
    description: {
      type: String,
      trim: true,
    },
    current_stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    min_stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    price_per_unit: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Adequate', 'Low', 'Critical'],
      default: 'Adequate',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

rawMaterialSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret.legacy_id;
    delete ret.legacy_id;
    delete ret._id;
  },
});

export default model('RawMaterial', rawMaterialSchema);

