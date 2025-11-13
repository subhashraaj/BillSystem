import { Schema, model, Types } from 'mongoose';

const itemBomSchema = new Schema(
  {
    item: {
      type: Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    raw_material: {
      type: Types.ObjectId,
      ref: 'RawMaterial',
      required: true,
    },
    quantity_per_unit: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
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

itemBomSchema.index({ item: 1, raw_material: 1 }, { unique: true });

itemBomSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

export default model('ItemBom', itemBomSchema);

