const PurchaseRequest = require('../models/PurchaseRequest');
const Product = require('../models/Product');
const Order = require('../models/Order');
const userStore = require('../utils/userStore');

exports.createRequest = async (req, res, next) => {
  try {
    const { productId, quantity, budgetLimit, justification, isRecurring, recurringIntervalDays } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product and quantity are required' });
    }
    const qty = Number(quantity);
    if (!qty || qty < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const estimatedCost = (product.priceRange?.min || 0) * qty;
    if (budgetLimit && estimatedCost > Number(budgetLimit)) {
      return res.status(400).json({ message: `Estimated cost ($${estimatedCost}) exceeds the budget limit ($${budgetLimit})` });
    }

    const request = await PurchaseRequest.create({
      buyerId: req.user.userId,
      productId: product._id,
      sellerId: product.sellerId,
      title: product.title,
      quantity: qty,
      estimatedCost,
      budgetLimit: budgetLimit ? Number(budgetLimit) : null,
      justification: justification || '',
      isRecurring: !!isRecurring,
      recurringIntervalDays: isRecurring ? Number(recurringIntervalDays) || 30 : null,
      nextRecurrenceDate: isRecurring
        ? new Date(Date.now() + (Number(recurringIntervalDays) || 30) * 24 * 60 * 60 * 1000)
        : null,
    });

    res.status(201).json({ request, message: 'Purchase request submitted for approval' });
  } catch (err) {
    next(err);
  }
};

exports.getMyRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { buyerId: req.user.userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [requests, total] = await Promise.all([
      PurchaseRequest.find(query)
        .populate('productId', 'images priceRange')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      PurchaseRequest.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(requests, ['sellerId']);

    res.json({ requests: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

// Self-approval flow: buyer (acting as their own approver in this MVP) approves/rejects,
// then approval auto-converts the request into a real order.
exports.actOnRequest = async (req, res, next) => {
  try {
    const { action, approverNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }

    const request = await PurchaseRequest.findOne({ _id: req.params.id, buyerId: req.user.userId });
    if (!request) return res.status(404).json({ message: 'Purchase request not found' });
    if (request.status !== 'pending-approval') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    request.approverNote = approverNote || '';

    if (action === 'reject') {
      request.status = 'rejected';
      await request.save();
      return res.json({ request, message: 'Purchase request rejected' });
    }

    const product = await Product.findById(request.productId);
    if (!product) return res.status(404).json({ message: 'Product no longer available' });
    if (product.stock < request.quantity) {
      return res.status(400).json({ message: `Only ${product.stock} units in stock` });
    }

    const unitPrice = product.priceRange?.min || 0;
    const order = await Order.create({
      buyerId: request.buyerId,
      sellerId: request.sellerId,
      productId: request.productId,
      title: request.title,
      quantity: request.quantity,
      unitPrice,
      costPrice: product.costPrice || 0,
      totalAmount: unitPrice * request.quantity,
      expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
    product.stock -= request.quantity;
    await product.save();

    request.status = 'converted';
    request.orderId = order._id;
    await request.save();

    res.json({ request, order, message: 'Purchase request approved and converted to order' });
  } catch (err) {
    next(err);
  }
};
