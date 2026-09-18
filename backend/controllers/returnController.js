const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const userStore = require('../utils/userStore');

exports.createReturnRequest = async (req, res, next) => {
  try {
    const { orderId, requestType, reason, amount } = req.body;
    if (!orderId || !reason?.trim()) {
      return res.status(400).json({ message: 'Order and reason are required' });
    }

    const order = await Order.findOne({ _id: orderId, buyerId: req.user.userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned or refunded' });
    }

    const existing = await ReturnRequest.findOne({ orderId, status: { $in: ['requested', 'approved'] } });
    if (existing) return res.status(400).json({ message: 'A return/refund request is already pending for this order' });

    const request = await ReturnRequest.create({
      orderId: order._id,
      buyerId: req.user.userId,
      sellerId: order.sellerId,
      requestType: ReturnRequest.TYPES.includes(requestType) ? requestType : 'refund',
      reason: reason.trim(),
      amount: amount ? Math.min(Number(amount), order.totalAmount) : order.totalAmount,
    });

    res.status(201).json({ request, message: 'Return/refund request submitted' });
  } catch (err) {
    next(err);
  }
};

exports.getMyReturnRequests = async (req, res, next) => {
  try {
    const requests = await ReturnRequest.find({ buyerId: req.user.userId })
      .populate('orderId', 'title totalAmount')
      .sort({ createdAt: -1 });
    const hydrated = await userStore.hydrate(requests, ['sellerId']);
    res.json({ requests: hydrated });
  } catch (err) {
    next(err);
  }
};

exports.getSellerReturnRequests = async (req, res, next) => {
  try {
    const requests = await ReturnRequest.find({ sellerId: req.user.userId })
      .populate('orderId', 'title totalAmount')
      .sort({ createdAt: -1 });
    const hydrated = await userStore.hydrate(requests, ['buyerId']);
    res.json({ requests: hydrated });
  } catch (err) {
    next(err);
  }
};

exports.actOnReturnRequest = async (req, res, next) => {
  try {
    const { action, resolutionNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }

    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, sellerId: req.user.userId };
    const request = await ReturnRequest.findOne(filter);
    if (!request) return res.status(404).json({ message: 'Return request not found' });
    if (request.status !== 'requested') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    request.resolutionNote = resolutionNote || '';
    request.resolvedAt = new Date();

    if (action === 'reject') {
      request.status = 'rejected';
      await request.save();
      return res.json({ request, message: 'Return request rejected' });
    }

    request.status = 'refunded';
    await request.save();
    await userStore.incrementCreditBalance(request.buyerId, request.amount);

    res.json({ request, message: 'Return approved and refunded to buyer credit balance' });
  } catch (err) {
    next(err);
  }
};
