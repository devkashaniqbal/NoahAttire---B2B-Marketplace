const mongoose = require('mongoose');

const savedSellerSchema = new mongoose.Schema(
  {
    buyerId: { type: String, required: true  },
    sellerId: { type: String, required: true  },
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

savedSellerSchema.index({ buyerId: 1, sellerId: 1 }, { unique: true });

module.exports = mongoose.model('SavedSeller', savedSellerSchema);
