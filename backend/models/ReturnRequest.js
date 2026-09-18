const mongoose = require('mongoose');

const STATUSES = ['requested', 'approved', 'rejected', 'refunded'];
const TYPES = ['refund', 'return'];

const returnRequestSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    buyerId: { type: String, required: true  },
    sellerId: { type: String, required: true  },
    requestType: { type: String, enum: TYPES, default: 'refund' },
    reason: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: STATUSES, default: 'requested' },
    resolutionNote: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

returnRequestSchema.index({ buyerId: 1, createdAt: -1 });
returnRequestSchema.index({ sellerId: 1, createdAt: -1 });

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
module.exports.STATUSES = STATUSES;
module.exports.TYPES = TYPES;
