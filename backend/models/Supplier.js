const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true  },
    name: { type: String, required: true, trim: true },
    material: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    location: { type: String, default: '' },
    lastOrderDate: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

supplierSchema.index({ sellerId: 1, createdAt: -1 });

module.exports = mongoose.model('Supplier', supplierSchema);
