import { Schema, model, Types } from 'mongoose';

const manufacturingSchema = new Schema(
  {
    legacy_id: {
      type: Number,
      unique: true,
      index: true,
      required: true,
    },
    item: {
      type: Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    quantity_manufactured: {
      type: Number,
      required: true,
      min: 1,
    },
    batch_number: {
      type: String,
      trim: true,
    },
    staff_name: {
      type: String,
      required: true,
      trim: true,
    },
    manufacturing_date: {
      type: Date,
      required: true,
    },
    manufacturing_time: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/,
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

manufacturingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret.legacy_id;
    delete ret.legacy_id;
    if (ret.item && ret.item.legacy_id) {
      ret.item_id = ret.item.legacy_id;
    }
    delete ret._id;
  },
});

export default model('Manufacturing', manufacturingSchema);

