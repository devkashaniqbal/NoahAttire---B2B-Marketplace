const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, default: 'meters', trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 50, min: 0 },
    costPerUnit: { type: Number, default: 0, min: 0 },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
    transactions: [
      {
        type: { type: String, enum: ['in', 'out'], required: true },
        quantity: { type: Number, required: true, min: 0 },
        note: { type: String, default: '' },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

rawMaterialSchema.index({ name: 1 });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
