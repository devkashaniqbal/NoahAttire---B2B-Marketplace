const mongoose = require('mongoose');

const DEPARTMENTS = ['cutting', 'stitching', 'packing', 'other'];

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    department: { type: String, enum: DEPARTMENTS, default: 'other' },
    hourlyRate: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

workerSchema.index({ department: 1 });

module.exports = mongoose.model('Worker', workerSchema);
module.exports.DEPARTMENTS = DEPARTMENTS;
