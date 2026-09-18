const Message = require('../models/Message');
const RFQ = require('../models/RFQ');
const SupportTicket = require('../models/SupportTicket');

// Confirms the requesting user is a participant of the given thread before
// allowing them to read or post messages on it.
async function authorizeThread(threadType, threadId, user) {
  if (user.role === 'admin') return true;

  if (threadType === 'rfq') {
    const rfq = await RFQ.findById(threadId);
    if (!rfq) return false;
    return rfq.buyerId.toString() === user.userId || rfq.sellerId.toString() === user.userId;
  }
  if (threadType === 'seller-chat') {
    // threadId is a composite "buyerId_sellerId" string — only those two parties can use it.
    return threadId.split('_').includes(user.userId);
  }
  if (threadType === 'ticket') {
    const ticket = await SupportTicket.findById(threadId);
    if (!ticket) return false;
    return ticket.buyerId.toString() === user.userId;
  }
  return false;
}

exports.getThread = async (req, res, next) => {
  try {
    const { threadType, threadId } = req.params;
    if (!Message.THREAD_TYPES.includes(threadType)) {
      return res.status(400).json({ message: 'Invalid thread type' });
    }
    const authorized = await authorizeThread(threadType, threadId, req.user);
    if (!authorized) return res.status(403).json({ message: 'Not authorized to view this thread' });

    const messages = await Message.find({ threadType, threadId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
};

exports.postMessage = async (req, res, next) => {
  try {
    const { threadType, threadId } = req.params;
    const { text } = req.body;
    if (!Message.THREAD_TYPES.includes(threadType)) {
      return res.status(400).json({ message: 'Invalid thread type' });
    }
    if (!text?.trim()) return res.status(400).json({ message: 'Message text is required' });

    const authorized = await authorizeThread(threadType, threadId, req.user);
    if (!authorized) return res.status(403).json({ message: 'Not authorized to message on this thread' });

    const message = await Message.create({
      threadType,
      threadId,
      senderId: req.user.userId,
      senderRole: req.user.role,
      text: text.trim(),
    });

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};
