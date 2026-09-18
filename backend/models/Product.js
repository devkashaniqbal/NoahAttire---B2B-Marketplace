const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true  },
    title: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, default: '' },
    brand: { type: String, trim: true, default: '' },
    description: { type: String, required: true },
    images: [{ type: String }],
    category: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: { validator: (arr) => Array.isArray(arr) && arr.length > 0, message: 'At least one category is required' },
    },
    subCategory: { type: [{ type: String, trim: true }], default: [] },
    priceRange: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
    },
    unit: { type: String, default: 'piece' },
    minOrderQty: { type: Number, default: 1, min: 1 },
    location: { type: String, default: '' },
    tags: [{ type: String }],
    moderationStatus: {
      type: String,
      enum: ['active', 'flagged', 'removed'],
      default: 'active',
    },
    stock: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    variants: [
      {
        name: { type: String, required: true, trim: true },
        options: [{ type: String, trim: true }],
      },
    ],
    reviews: [
      {
        userId:    { type: String, required: true },
        userName:  { type: String, required: true, trim: true },
        rating:    { type: Number, required: true, min: 1, max: 5 },
        comment:   { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    avgRating:   { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text', tags: 'text', sku: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ sku: 1 });

module.exports = mongoose.model('Product', productSchema);
