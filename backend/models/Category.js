const mongoose = require('mongoose');

const DEFAULT_CATEGORIES = [
  { name: "Men's Apparel", icon: 'Shirt', order: 1 },
  { name: "Women's Apparel", icon: 'ShoppingBag', order: 2 },
  { name: "Kids' Apparel", icon: 'Baby', order: 3 },
  { name: 'Fashion Wear & Streetwear', icon: 'Sparkles', order: 4 },
  { name: 'Sportswear', icon: 'Dumbbell', order: 5 },
  { name: 'Martial Arts Wear', icon: 'Swords', order: 6 },
  { name: 'Workwear & Uniforms', icon: 'HardHat', order: 7 },
  { name: 'Medical Apparel', icon: 'Stethoscope', order: 8 },
  { name: 'Safety Wear', icon: 'ShieldAlert', order: 9 },
  { name: 'Leather Products', icon: 'Briefcase', order: 10 },
  { name: 'Championship Belts', icon: 'Trophy', order: 11 },
  { name: 'Motorcycle Apparel', icon: 'Bike', order: 12 },
  { name: 'Tactical & Outdoor Wear', icon: 'Tent', order: 13 },
  { name: 'Hunting & Fishing Apparel', icon: 'Fish', order: 14 },
  { name: 'Rainwear', icon: 'CloudRain', order: 15 },
  { name: 'Denim Wear', icon: 'Layers', order: 16 },
  { name: 'Pet Apparel', icon: 'Dog', order: 17 },
  { name: 'Promotional Merchandise', icon: 'Gift', order: 18 },
  { name: 'Sleepwear', icon: 'Moon', order: 19 },
  { name: 'Accessories', icon: 'Watch', order: 20 },
];

const categorySchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    icon:   { type: String, default: 'Package' },
    image:  { type: String, default: '' },
    order:  { type: Number, default: 0 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true }
);

// unique per parent level
categorySchema.index({ name: 1, parent: 1 }, { unique: true });

categorySchema.statics.seedDefaults = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.insertMany(DEFAULT_CATEGORIES);
  }
};

module.exports = mongoose.model('Category', categorySchema);
