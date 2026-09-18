const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerId: { type: String, required: true  },
    buyerId: { type: String, default: null  },
    buyerName: { type: String, required: true, trim: true },
    buyerEmail: { type: String, required: true, lowercase: true, trim: true },
    buyerPhone: { type: String, default: '' },
    message: { type: String, required: true },
    quantity: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'closed'],
      default: 'new',
    },
    sellerReply: { type: String, default: '' },
    repliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

inquirySchema.index({ sellerId: 1, createdAt: -1 });
inquirySchema.index({ status: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
