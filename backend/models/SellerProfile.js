const mongoose = require('mongoose');

const sellerProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true  },
    businessName: { type: String, trim: true, default: '' },
    logo: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    location: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);
