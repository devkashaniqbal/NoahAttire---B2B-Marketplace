const mongoose = require('mongoose');

const STATUSES = ['open', 'in-progress', 'resolved', 'closed'];
const CATEGORIES = ['order', 'payment', 'product', 'account', 'complaint', 'other'];

const supportTicketSchema = new mongoose.Schema(
  {
    buyerId: { type: String, required: true  },
    subject: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    description: { type: String, required: true },
    status: { type: String, enum: STATUSES, default: 'open' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

supportTicketSchema.index({ buyerId: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
module.exports.STATUSES = STATUSES;
module.exports.CATEGORIES = CATEGORIES;
