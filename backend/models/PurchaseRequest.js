const mongoose = require('mongoose');

const STATUSES = ['pending-approval', 'approved', 'rejected', 'converted'];

const purchaseRequestSchema = new mongoose.Schema(
  {
    buyerId: { type: String, required: true  },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerId: { type: String, required: true  },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    estimatedCost: { type: Number, default: 0 },
    budgetLimit: { type: Number, default: null },
    justification: { type: String, default: '' },
    status: { type: String, enum: STATUSES, default: 'pending-approval' },
    approverNote: { type: String, default: '' },
    isRecurring: { type: Boolean, default: false },
    recurringIntervalDays: { type: Number, default: null },
    nextRecurrenceDate: { type: Date, default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

purchaseRequestSchema.index({ buyerId: 1, createdAt: -1 });

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);
module.exports.STATUSES = STATUSES;
