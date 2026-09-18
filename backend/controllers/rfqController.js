const mongoose = require('mongoose');
const RFQ = require('../models/RFQ');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Message = require('../models/Message');
const userStore = require('../utils/userStore');

exports.createRFQ = async (req, res, next) => {
  try {
    const { productId, quantity, targetPrice, specs } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product and quantity are required' });
    }

    const qty = Number(quantity);
    if (!qty || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const rfq = await RFQ.create({
      buyerId: req.user.userId,
      sellerId: product.sellerId,
      productId: product._id,
      title: product.title,
      quantity: qty,
      targetPrice: targetPrice ? Number(targetPrice) : null,
      specs: specs || '',
    });

    res.status(201).json({ rfq, message: 'Quote request submitted' });
  } catch (err) {
    next(err);
  }
};

// Broadcast the same RFQ to multiple sellers at once so the buyer can compare quotes
exports.createRFQGroup = async (req, res, next) => {
  try {
    const { productIds, quantity, targetPrice, specs } = req.body;
    if (!Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ message: 'Select at least 2 products from different sellers to compare' });
    }
    const qty = Number(quantity);
    if (!qty || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length < 2) return res.status(404).json({ message: 'Products not found' });

    const requestGroupId = new mongoose.Types.ObjectId();
    const rfqs = await RFQ.insertMany(
      products.map((product) => ({
        buyerId: req.user.userId,
        sellerId: product.sellerId,
        productId: product._id,
        title: product.title,
        quantity: qty,
        targetPrice: targetPrice ? Number(targetPrice) : null,
        specs: specs || '',
        requestGroupId,
      }))
    );

    res.status(201).json({ rfqs, requestGroupId, message: 'Quote requests sent to all selected sellers' });
  } catch (err) {
    next(err);
  }
};

exports.getRFQGroup = async (req, res, next) => {
  try {
    const rfqs = await RFQ.find({ requestGroupId: req.params.groupId, buyerId: req.user.userId })
      .populate('productId', 'images')
      .sort({ 'quote.price': 1 });
    if (!rfqs.length) return res.status(404).json({ message: 'Quote comparison not found' });
    const hydrated = await userStore.hydrate(rfqs, ['sellerId']);
    res.json({ rfqs: hydrated });
  } catch (err) {
    next(err);
  }
};

exports.getBuyerRFQs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { buyerId: req.user.userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [rfqs, total] = await Promise.all([
      RFQ.find(query)
        .populate('productId', 'images')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      RFQ.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(rfqs, ['sellerId']);

    res.json({ rfqs: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.getSellerRFQs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { sellerId: req.user.userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [rfqs, total] = await Promise.all([
      RFQ.find(query)
        .populate('productId', 'images')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      RFQ.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(rfqs, ['buyerId']);

    res.json({ rfqs: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.submitQuote = async (req, res, next) => {
  try {
    const { price, leadTimeDays, notes } = req.body;
    if (!price || Number(price) <= 0) {
      return res.status(400).json({ message: 'A valid quote price is required' });
    }

    const rfq = await RFQ.findOne({ _id: req.params.id, sellerId: req.user.userId });
    if (!rfq) return res.status(404).json({ message: 'RFQ not found or unauthorized' });
    if (rfq.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending RFQs can be quoted' });
    }

    rfq.quote = {
      price: Number(price),
      leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,
      notes: notes || '',
      quotedAt: new Date(),
    };
    rfq.status = 'quoted';
    await rfq.save();

    res.json({ rfq, message: 'Quote submitted' });
  } catch (err) {
    next(err);
  }
};

exports.acceptQuote = async (req, res, next) => {
  try {
    const rfq = await RFQ.findOne({ _id: req.params.id, buyerId: req.user.userId });
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
    if (rfq.status !== 'quoted') {
      return res.status(400).json({ message: 'Only quoted RFQs can be accepted' });
    }

    const product = await Product.findById(rfq.productId);
    if (!product) return res.status(404).json({ message: 'Product no longer available' });
    if (product.stock < rfq.quantity) {
      return res.status(400).json({ message: `Only ${product.stock} units in stock` });
    }

    const order = await Order.create({
      buyerId: rfq.buyerId,
      sellerId: rfq.sellerId,
      productId: rfq.productId,
      title: rfq.title,
      quantity: rfq.quantity,
      unitPrice: rfq.quote.price,
      costPrice: product.costPrice || 0,
      totalAmount: rfq.quote.price * rfq.quantity,
      expectedDeliveryDate: rfq.quote.leadTimeDays
        ? new Date(Date.now() + rfq.quote.leadTimeDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    product.stock -= rfq.quantity;
    await product.save();

    rfq.status = 'accepted';
    rfq.orderId = order._id;
    await rfq.save();

    res.json({ rfq, order, message: 'Quote accepted and order created' });
  } catch (err) {
    next(err);
  }
};

exports.rejectQuote = async (req, res, next) => {
  try {
    const rfq = await RFQ.findOne({ _id: req.params.id, buyerId: req.user.userId });
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
    if (rfq.status !== 'quoted') {
      return res.status(400).json({ message: 'Only quoted RFQs can be rejected' });
    }

    rfq.status = 'rejected';
    await rfq.save();

    res.json({ rfq, message: 'Quote rejected' });
  } catch (err) {
    next(err);
  }
};
