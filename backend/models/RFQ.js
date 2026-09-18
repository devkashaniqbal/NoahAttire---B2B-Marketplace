const mongoose = require('mongoose');

const STATUSES = ['pending', 'quoted', 'accepted', 'rejected', 'expired'];

const rfqSchema = new mongoose.Schema(
  {
    buyerId: { type: String, required: true  },
    sellerId: { type: String, required: true  },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    targetPrice: { type: Number, default: null },
    specs: { type: String, default: '' },
    status: { type: String, enum: STATUSES, default: 'pending' },
    quote: {
      price: { type: Number, default: null },
      leadTimeDays: { type: Number, default: null },
      notes: { type: String, default: '' },
      quotedAt: { type: Date, default: null },
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    requestGroupId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

rfqSchema.index({ sellerId: 1, createdAt: -1 });
rfqSchema.index({ buyerId: 1, createdAt: -1 });

module.exports = mongoose.model('RFQ', rfqSchema);
module.exports.STATUSES = STATUSES;
