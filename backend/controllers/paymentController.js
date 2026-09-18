const Payment = require('../models/Payment');
const Order = require('../models/Order');
const userStore = require('../utils/userStore');

exports.createPayment = async (req, res, next) => {
  try {
    const { orderId, amount, method, screenshotUrl, notes } = req.body;
    if (!orderId || !amount || !screenshotUrl) {
      return res.status(400).json({ message: 'Order, amount, and payment screenshot are required' });
    }

    const order = await Order.findOne({ _id: orderId, buyerId: req.user.userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const payment = await Payment.create({
      orderId: order._id,
      buyerId: req.user.userId,
      sellerId: order.sellerId,
      amount: Number(amount),
      method: method || 'Bank Transfer',
      screenshotUrl,
      notes: notes || '',
    });

    res.status(201).json({ payment, message: 'Payment proof submitted' });
  } catch (err) {
    next(err);
  }
};

exports.getBuyerPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { buyerId: req.user.userId };
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('orderId', 'title totalAmount')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Payment.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(payments, ['sellerId']);

    res.json({ payments: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.getSellerPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { sellerId: req.user.userId };
    if (status) query.status = status;
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('orderId', 'title totalAmount')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Payment.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(payments, ['buyerId']);

    res.json({ payments: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified or rejected' });
    }

    const payment = await Payment.findOne({ _id: req.params.id, sellerId: req.user.userId });
    if (!payment) return res.status(404).json({ message: 'Payment not found or unauthorized' });

    payment.status = status;
    payment.verifiedAt = new Date();
    if (status === 'rejected') payment.rejectionReason = rejectionReason || '';
    await payment.save();

    res.json({ payment, message: `Payment ${status}` });
  } catch (err) {
    next(err);
  }
};
