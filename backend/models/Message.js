const mongoose = require('mongoose');

const THREAD_TYPES = ['rfq', 'seller-chat', 'ticket'];

const messageSchema = new mongoose.Schema(
  {
    threadType: { type: String, enum: THREAD_TYPES, required: true },
    // String so it can hold either an ObjectId (rfq/ticket) or a composite
    // "buyerId_sellerId" id (seller-chat) under one uniform query shape.
    threadId: { type: String, required: true },
    senderId: { type: String, required: true  },
    senderRole: { type: String, enum: ['buyer', 'seller', 'admin'], required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

messageSchema.index({ threadType: 1, threadId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
module.exports.THREAD_TYPES = THREAD_TYPES;
