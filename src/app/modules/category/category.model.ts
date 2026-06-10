import { model, Schema } from 'mongoose';
import { TCategory } from './category.interface';

const categorySchema = new Schema<TCategory>(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    parentage: { type: Number, required: [true, 'Parentage is required'] },
    serviceType: {
      type: String,
      enum: ['house', 'rideshare', 'road'],
      required: [true, 'Service type is required'],
    },
  },

  {
    timestamps: true,
  },
);

// for referring services in category
categorySchema.virtual('services', {
  ref: 'Service', // The model to fetch documents from
  localField: '_id', // The primary key on Category
  foreignField: 'category', // The field name on the Service model that references Category
});

// Ensure virtuals are included when converting documents to JSON/Objects
categorySchema.set('toObject', { virtuals: true });
categorySchema.set('toJSON', { virtuals: true });

const Category = model<TCategory>('Category', categorySchema);
export default Category;
