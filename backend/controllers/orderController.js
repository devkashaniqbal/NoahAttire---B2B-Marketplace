const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const RFQ = require('../models/RFQ');
const userStore = require('../utils/userStore');

exports.createOrder = async (req, res, next) => {
  try {
    const { productId, quantity, shippingAddress, expectedDeliveryDate } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product and quantity are required' });
    }

    const qty = Number(quantity);
    if (!qty || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.minOrderQty && qty < product.minOrderQty) {
      return res.status(400).json({ message: `Minimum order quantity is ${product.minOrderQty}` });
    }
    if (product.stock < qty) {
      return res.status(400).json({ message: `Only ${product.stock} units in stock` });
    }

    const unitPrice = product.priceRange?.min || 0;

    const order = await Order.create({
      buyerId: req.user.userId,
      sellerId: product.sellerId,
      productId: product._id,
      title: product.title,
      quantity: qty,
      unitPrice,
      costPrice: product.costPrice || 0,
      totalAmount: unitPrice * qty,
      shippingAddress: shippingAddress || '',
      expectedDeliveryDate: expectedDeliveryDate
        ? new Date(expectedDeliveryDate)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    product.stock -= qty;
    await product.save();

    res.status(201).json({ order, message: 'Order placed successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getBuyerOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { buyerId: req.user.userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('productId', 'images')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Order.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(orders, ['sellerId']);

    res.json({ orders: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyerId: req.user.userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    order.status = 'cancelled';
    order.cancelReason = req.body.reason || '';
    await order.save();

    const product = await Product.findById(order.productId);
    if (product) {
      product.stock += order.quantity;
      await product.save();
    }

    res.json({ order, message: 'Order cancelled' });
  } catch (err) {
    next(err);
  }
};

// Cancellation request for orders already past 'pending' — needs seller approval
// rather than an instant buyer-side cancel.
exports.requestCancel = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyerId: req.user.userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['in-production', 'ready'].includes(order.status)) {
      return res.status(400).json({ message: 'Cancellation requests are only available while an order is in production' });
    }
    if (order.cancelRequest?.status === 'pending') {
      return res.status(400).json({ message: 'A cancellation request is already pending for this order' });
    }

    order.cancelRequest = { status: 'pending', reason: req.body.reason || '', requestedAt: new Date() };
    await order.save();

    res.json({ order, message: 'Cancellation request sent to the supplier for approval' });
  } catch (err) {
    next(err);
  }
};

exports.respondToCancelRequest = async (req, res, next) => {
  try {
    const { approve } = req.body;
    const order = await Order.findOne({ _id: req.params.id, sellerId: req.user.userId });
    if (!order) return res.status(404).json({ message: 'Order not found or unauthorized' });
    if (order.cancelRequest?.status !== 'pending') {
      return res.status(400).json({ message: 'No pending cancellation request on this order' });
    }

    if (approve) {
      order.status = 'cancelled';
      order.cancelReason = order.cancelRequest.reason;
      order.cancelRequest.status = 'approved';
      const product = await Product.findById(order.productId);
      if (product) {
        product.stock += order.quantity;
        await product.save();
      }
    } else {
      order.cancelRequest.status = 'rejected';
    }
    await order.save();

    res.json({ order, message: approve ? 'Cancellation approved' : 'Cancellation request rejected' });
  } catch (err) {
    next(err);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    const original = await Order.findOne({ _id: req.params.id, buyerId: req.user.userId });
    if (!original) return res.status(404).json({ message: 'Order not found' });

    const product = await Product.findById(original.productId);
    if (!product) return res.status(404).json({ message: 'Product is no longer available' });
    if (product.stock < original.quantity) {
      return res.status(400).json({ message: `Only ${product.stock} units in stock` });
    }

    const unitPrice = product.priceRange?.min || 0;
    const order = await Order.create({
      buyerId: req.user.userId,
      sellerId: product.sellerId,
      productId: product._id,
      title: product.title,
      quantity: original.quantity,
      unitPrice,
      costPrice: product.costPrice || 0,
      totalAmount: unitPrice * original.quantity,
      shippingAddress: original.shippingAddress || '',
      expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    product.stock -= original.quantity;
    await product.save();

    res.status(201).json({ order, message: 'Reorder placed successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getSellerOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { sellerId: req.user.userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('productId', 'images')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Order.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(orders, ['buyerId']);

    res.json({ orders: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStage = async (req, res, next) => {
  try {
    const { status, productionStage } = req.body;
    const order = await Order.findOne({ _id: req.params.id, sellerId: req.user.userId });
    if (!order) return res.status(404).json({ message: 'Order not found or unauthorized' });

    if (status) {
      if (!Order.STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      order.status = status;
      if (status === 'in-production' && !order.productionStartedAt) order.productionStartedAt = new Date();
      if (status === 'shipped') order.shippedAt = new Date();
      if (status === 'delivered') order.deliveredAt = new Date();
    }
    if (productionStage) {
      if (!Order.STAGES.includes(productionStage)) {
        return res.status(400).json({ message: 'Invalid production stage' });
      }
      order.productionStage = productionStage;
    }

    await order.save();
    res.json({ order, message: 'Order updated' });
  } catch (err) {
    next(err);
  }
};

exports.addOrderUpdate = async (req, res, next) => {
  try {
    const { message, unitsCompleted } = req.body;
    if (!message?.trim() && unitsCompleted === undefined) {
      return res.status(400).json({ message: 'Provide an update message or units completed' });
    }

    const order = await Order.findOne({ _id: req.params.id, sellerId: req.user.userId });
    if (!order) return res.status(404).json({ message: 'Order not found or unauthorized' });

    let units = null;
    if (unitsCompleted !== undefined && unitsCompleted !== '') {
      units = Number(unitsCompleted);
      if (Number.isNaN(units) || units < 0) {
        return res.status(400).json({ message: 'Units completed must be a positive number' });
      }
      if (units > order.quantity) {
        return res.status(400).json({ message: `Units completed cannot exceed order quantity (${order.quantity})` });
      }
      order.unitsCompleted = units;
    }

    order.updates.push({ message: message?.trim() || '', unitsCompleted: units });
    await order.save();

    res.status(201).json({ order, message: 'Update posted' });
  } catch (err) {
    next(err);
  }
};

function generateTrackingId(orderId) {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const suffix = orderId.toString().slice(-6).toUpperCase();
  return `TRK-${datePart}-${suffix}`;
}

exports.updateTracking = async (req, res, next) => {
  try {
    const { trackingNumber, carrier } = req.body;

    const order = await Order.findOne({ _id: req.params.id, sellerId: req.user.userId });
    if (!order) return res.status(404).json({ message: 'Order not found or unauthorized' });

    order.trackingNumber = trackingNumber?.trim() || order.trackingNumber || generateTrackingId(order._id);
    order.carrier = carrier?.trim() || '';
    if (order.status === 'ready') {
      order.status = 'shipped';
      order.shippedAt = new Date();
    }
    await order.save();

    res.json({ order, message: 'Tracking info updated' });
  } catch (err) {
    next(err);
  }
};

exports.getSellerAnalytics = async (req, res, next) => {
  try {
    const sellerId = req.user.userId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrders, totalRevenueAgg, ordersByStatusAgg, revenueTrendAgg,
      topProductsAgg, pendingRfqCount,
    ] = await Promise.all([
      Order.countDocuments({ sellerId }),
      Order.aggregate([
        { $match: { sellerId: sellerId, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: { $subtract: ['$totalAmount', { $multiply: ['$costPrice', '$quantity'] }] } } } },
      ]),
      Order.aggregate([
        { $match: { sellerId: sellerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { sellerId: sellerId, createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            profit: { $sum: { $subtract: ['$totalAmount', { $multiply: ['$costPrice', '$quantity'] }] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { sellerId: sellerId, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$productId', title: { $first: '$title' }, totalQty: { $sum: '$quantity' }, totalRevenue: { $sum: '$totalAmount' } } },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
      ]),
      RFQ.countDocuments({ sellerId, status: 'pending' }),
    ]);

    const statusMap = {};
    ordersByStatusAgg.forEach(({ _id, count }) => { statusMap[_id] = count; });

    res.json({
      analytics: {
        totalOrders,
        revenue: totalRevenueAgg[0]?.revenue || 0,
        profit: totalRevenueAgg[0]?.profit || 0,
        ordersByStatus: statusMap,
        revenueTrend: revenueTrendAgg.map((d) => ({ date: d._id, revenue: d.revenue, profit: d.profit })),
        topProducts: topProductsAgg.map((d) => ({ _id: d._id, title: d.title, totalQty: d.totalQty, totalRevenue: d.totalRevenue })),
        pendingRfqs: pendingRfqCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getBuyerAnalytics = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const buyerObjectId = buyerId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrders, totalSpendAgg, ordersByStatusAgg, spendTrendAgg, topSellersAgg,
    ] = await Promise.all([
      Order.countDocuments({ buyerId }),
      Order.aggregate([
        { $match: { buyerId: buyerObjectId, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalSpend: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { buyerId: buyerObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { buyerId: buyerObjectId, createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, spend: { $sum: '$totalAmount' } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { buyerId: buyerObjectId, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$sellerId', totalOrders: { $sum: 1 }, totalSpend: { $sum: '$totalAmount' } } },
        { $sort: { totalSpend: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const sellerProfiles = await userStore.getUserProfiles(topSellersAgg.map((s) => s._id));
    const topSellers = topSellersAgg.map((s) => ({
      sellerName: sellerProfiles[s._id]?.name || 'Unknown Seller',
      totalOrders: s.totalOrders,
      totalSpend: s.totalSpend,
    }));

    const statusMap = {};
    ordersByStatusAgg.forEach(({ _id, count }) => { statusMap[_id] = count; });

    res.json({
      analytics: {
        totalOrders,
        totalSpend: totalSpendAgg[0]?.totalSpend || 0,
        ordersByStatus: statusMap,
        spendTrend: spendTrendAgg.map((d) => ({ date: d._id, spend: d.spend })),
        topSellers,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Order.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(orders, ['buyerId', 'sellerId']);

    res.json({ orders: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};
