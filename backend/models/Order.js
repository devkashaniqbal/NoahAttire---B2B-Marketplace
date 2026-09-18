const mongoose = require('mongoose');

const STATUSES = ['pending', 'in-production', 'ready', 'shipped', 'delivered', 'cancelled'];
const STAGES = ['cutting', 'stitching', 'packing', 'done'];

const orderSchema = new mongoose.Schema(
  {
    buyerId: { type: String, required: true  },
    sellerId: { type: String, required: true  },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: STATUSES, default: 'pending' },
    productionStage: { type: String, enum: STAGES, default: 'cutting' },
    shippingAddress: { type: String, default: '' },
    expectedDeliveryDate: { type: Date },
    productionStartedAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
    unitsCompleted: { type: Number, default: 0, min: 0 },
    trackingNumber: { type: String, default: '' },
    carrier: { type: String, default: '' },
    deliveryProof: { type: String, default: '' },
    paidWithCredit: { type: Number, default: 0 },
    cancelRequest: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: null },
      reason: { type: String, default: '' },
      requestedAt: { type: Date, default: null },
    },
    updates: [
      {
        message: { type: String, default: '' },
        unitsCompleted: { type: Number, default: null },
        postedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.STATUSES = STATUSES;
module.exports.STAGES = STAGES;
