const mongoose = require('mongoose');

const STATUSES = ['pending', 'verified', 'rejected'];

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    buyerId: { type: String, required: true  },
    sellerId: { type: String, required: true  },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, default: 'Bank Transfer' },
    screenshotUrl: { type: String, required: true },
    status: { type: String, enum: STATUSES, default: 'pending' },
    notes: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ sellerId: 1, createdAt: -1 });
paymentSchema.index({ buyerId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
module.exports.STATUSES = STATUSES;
