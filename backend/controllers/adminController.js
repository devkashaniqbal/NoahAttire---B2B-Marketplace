const userStore = require('../utils/userStore');
const SellerProfile = require('../models/SellerProfile');
const Product = require('../models/Product');
const Inquiry = require('../models/Inquiry');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const RawMaterial = require('../models/RawMaterial');
const { sendOrderStatusUpdateEmail } = require('../utils/email');
const { attachBrandNames } = require('../utils/brand');

exports.getStats = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const now = new Date();

    const [
      totalSellers, totalBuyers, totalProducts, totalInquiries,
      pendingSellers, approvedSellers, rejectedSellers,
      newInquiries, inProgressInquiries, closedInquiries,
      recentInquiriesCount, flaggedProducts, removedProducts,
      productsByCategory, recentInquiries,
      totalOrders, ordersByStatusAgg, productionStageAgg,
      stockAgg, lowStockProducts, monthOrdersAgg,
      revenueVsProfitAgg, topSellingAgg, recentOrders,
      latestActiveOrder, overdueOrders, todayOrdersAgg,
    ] = await Promise.all([
      userStore.listUsers({ role: 'seller' }).then((u) => u.length),
      userStore.listUsers({ role: 'buyer' }).then((u) => u.length),
      Product.countDocuments({ moderationStatus: { $ne: 'removed' } }),
      Inquiry.countDocuments(),
      SellerProfile.countDocuments({ approvalStatus: 'pending' }),
      SellerProfile.countDocuments({ approvalStatus: 'approved' }),
      SellerProfile.countDocuments({ approvalStatus: 'rejected' }),
      Inquiry.countDocuments({ status: 'new' }),
      Inquiry.countDocuments({ status: 'in-progress' }),
      Inquiry.countDocuments({ status: 'closed' }),
      Inquiry.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Product.countDocuments({ moderationStatus: 'flagged' }),
      Product.countDocuments({ moderationStatus: 'removed' }),
      Product.aggregate([
        { $match: { moderationStatus: { $ne: 'removed' } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Inquiry.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('productId', 'title category'),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { status: 'in-production' } },
        { $group: { _id: '$productionStage', count: { $sum: 1 } } },
      ]),
      Product.aggregate([
        { $match: { moderationStatus: { $ne: 'removed' } } },
        { $group: { _id: null, total: { $sum: '$stock' } } },
      ]),
      Product.find({
        moderationStatus: { $ne: 'removed' },
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      }).select('title stock lowStockThreshold images updatedAt').sort({ stock: 1 }).limit(5),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalAmount' },
            expenses: { $sum: { $multiply: ['$costPrice', '$quantity'] } },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'cancelled' } } },
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
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: '$productId', title: { $first: '$title' }, totalQty: { $sum: '$quantity' } } },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(6),
      Order.findOne({ status: 'in-production' }).sort({ createdAt: -1 }),
      Order.find({ expectedDeliveryDate: { $lt: now }, status: { $nin: ['delivered', 'cancelled'] } })
        .sort({ expectedDeliveryDate: 1 })
        .limit(3)
        .select('title expectedDeliveryDate status'),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalAmount' },
            expenses: { $sum: { $multiply: ['$costPrice', '$quantity'] } },
          },
        },
      ]),
    ]);

    const [hydratedRecentInquiries, hydratedRecentOrders] = await Promise.all([
      userStore.hydrate(recentInquiries, ['sellerId']),
      userStore.hydrate(recentOrders, ['buyerId', 'sellerId']),
    ]);

    const statusMap = {};
    ordersByStatusAgg.forEach(({ _id, count }) => { statusMap[_id] = count; });
    const stageMap = {};
    productionStageAgg.forEach(({ _id, count }) => { stageMap[_id] = count; });

    const revenue = monthOrdersAgg[0]?.revenue || 0;
    const productionExpenses = monthOrdersAgg[0]?.expenses || 0;
    const todayRevenue = todayOrdersAgg[0]?.revenue || 0;
    const todayExpenses = todayOrdersAgg[0]?.expenses || 0;

    res.json({
      stats: {
        totalSellers, totalBuyers, totalProducts, totalInquiries,
        sellers: { pending: pendingSellers, approved: approvedSellers, rejected: rejectedSellers },
        inquiries: { new: newInquiries, inProgress: inProgressInquiries, closed: closedInquiries, recentWeek: recentInquiriesCount },
        products: { active: totalProducts - flaggedProducts, flagged: flaggedProducts, removed: removedProducts },
        productsByCategory,
        recentInquiries: hydratedRecentInquiries,

        totalOrders,
        pendingOrders: statusMap.pending || 0,
        ordersOverview: {
          pending: statusMap.pending || 0,
          inProduction: statusMap['in-production'] || 0,
          ready: statusMap.ready || 0,
          shipped: statusMap.shipped || 0,
          delivered: statusMap.delivered || 0,
          cancelled: statusMap.cancelled || 0,
        },
        productionProgress: {
          cutting: stageMap.cutting || 0,
          stitching: stageMap.stitching || 0,
          packing: stageMap.packing || 0,
        },
        availableStock: stockAgg[0]?.total || 0,
        lowStockAlerts: lowStockProducts,
        productionExpenses,
        revenue,
        profitLoss: revenue - productionExpenses,
        today: {
          revenue: todayRevenue,
          expenses: todayExpenses,
          profitLoss: todayRevenue - todayExpenses,
        },
        revenueVsProfit: revenueVsProfitAgg.map((d) => ({ date: d._id, revenue: d.revenue, profit: d.profit })),
        topSellingProducts: topSellingAgg.map((d) => ({
          _id: d._id,
          title: d.title,
          totalQty: d.totalQty,
          image: d.product?.[0]?.images?.[0] || null,
        })),
        recentOrders: hydratedRecentOrders,
        orderTimeline: latestActiveOrder ? {
          orderId: latestActiveOrder._id,
          title: latestActiveOrder.title,
          orderReceivedAt: latestActiveOrder.createdAt,
          productionStartedAt: latestActiveOrder.productionStartedAt,
          expectedDeliveryDate: latestActiveOrder.expectedDeliveryDate,
          deliveredAt: latestActiveOrder.deliveredAt,
          status: latestActiveOrder.status,
        } : null,
        recentAlerts: [
          ...lowStockProducts.slice(0, 3).map((p) => ({
            type: 'low-stock',
            message: `${p.title} is low on stock (${p.stock} left)`,
            date: p.updatedAt || new Date(),
          })),
          ...overdueOrders.map((o) => ({
            type: 'overdue',
            message: `Order "${o.title}" is overdue for delivery`,
            date: o.expectedDeliveryDate,
          })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    let users = await userStore.listUsers(role ? { role } : {});
    users = users.filter((u) => u.role !== 'admin');
    if (search) {
      const re = new RegExp(search, 'i');
      users = users.filter((u) => re.test(u.name) || re.test(u.email));
    }
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = users.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paged = users.slice(skip, skip + Number(limit));

    res.json({ users: paged, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.banUser = async (req, res, next) => {
  try {
    const user = await userStore.updateUserProfile(req.params.id, { isBanned: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user, message: 'User banned successfully' });
  } catch (err) {
    next(err);
  }
};

exports.unbanUser = async (req, res, next) => {
  try {
    const user = await userStore.updateUserProfile(req.params.id, { isBanned: false });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user, message: 'User unbanned successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getAllSellers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, approvalStatus } = req.query;

    let profileFilter = {};
    if (approvalStatus && approvalStatus !== 'all') profileFilter.approvalStatus = approvalStatus;

    if (search) {
      const sellerUsers = await userStore.listUsers({ role: 'seller' });
      const re = new RegExp(search, 'i');
      const matchingIds = sellerUsers.filter((u) => re.test(u.name) || re.test(u.email)).map((u) => u.uid);
      profileFilter.userId = { $in: matchingIds };
    }

    let sellers = await SellerProfile.find(profileFilter).sort({ createdAt: -1 });
    sellers = await userStore.hydrate(sellers, ['userId']);

    const total = sellers.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paged = sellers.slice(skip, skip + Number(limit));

    res.json({ sellers: paged, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

exports.approveSeller = async (req, res, next) => {
  try {
    let profile = await SellerProfile.findOneAndUpdate(
      { userId: req.params.id },
      { approvalStatus: 'approved', isActive: true, rejectionReason: '' },
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: 'Seller not found' });
    profile = await userStore.hydrate(profile, ['userId']);
    res.json({ profile, message: 'Seller approved' });
  } catch (err) {
    next(err);
  }
};

exports.rejectSeller = async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    let profile = await SellerProfile.findOneAndUpdate(
      { userId: req.params.id },
      { approvalStatus: 'rejected', isActive: false, rejectionReason: reason },
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: 'Seller not found' });
    profile = await userStore.hydrate(profile, ['userId']);
    res.json({ profile, message: 'Seller rejected' });
  } catch (err) {
    next(err);
  }
};

exports.suspendSeller = async (req, res, next) => {
  try {
    let profile = await SellerProfile.findOneAndUpdate(
      { userId: req.params.id },
      { isActive: false },
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: 'Seller not found' });
    profile = await userStore.hydrate(profile, ['userId']);
    res.json({ profile, message: 'Seller suspended' });
  } catch (err) {
    next(err);
  }
};

exports.reactivateSeller = async (req, res, next) => {
  try {
    let profile = await SellerProfile.findOneAndUpdate(
      { userId: req.params.id },
      { isActive: true, approvalStatus: 'approved' },
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: 'Seller not found' });
    profile = await userStore.hydrate(profile, ['userId']);
    res.json({ profile, message: 'Seller reactivated' });
  } catch (err) {
    next(err);
  }
};

// Escapes regex metacharacters so free-text search input can never throw or be
// interpreted as a pattern (e.g. a stray "(" would otherwise 500 the endpoint).
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Resolves a free-text term to matching seller uids by business name (Mongo) and
// by person name/email (Firestore) so "search by supplier" can hit either source.
async function resolveSupplierSellerIds(term) {
  const regex = new RegExp(escapeRegex(term), 'i');
  const [profileMatches, sellers] = await Promise.all([
    SellerProfile.find({ businessName: regex }).select('userId'),
    userStore.listUsers({ role: 'seller' }),
  ]);
  const ids = new Set(profileMatches.map((p) => p.userId));
  sellers.forEach((s) => { if (regex.test(s.name || '') || regex.test(s.email || '')) ids.add(s.uid); });
  return [...ids];
}

async function buildProductQuery(reqQuery) {
  const { search, category, subCategory, brand, moderationStatus, sellerId } = reqQuery;
  const query = {};
  if (category && category !== 'all') query.category = category;
  if (subCategory && subCategory !== 'all') query.subCategory = subCategory;
  if (brand && brand !== 'all') query.brand = new RegExp(escapeRegex(brand), 'i');
  if (sellerId) query.sellerId = sellerId;
  if (moderationStatus && moderationStatus !== 'all') query.moderationStatus = moderationStatus;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const supplierIds = await resolveSupplierSellerIds(search);
    query.$or = [
      { title: regex },
      { description: regex },
      { sku: regex },
      { brand: regex },
      { category: regex },
      { tags: regex },
      ...(supplierIds.length ? [{ sellerId: { $in: supplierIds } }] : []),
    ];
  }
  return query;
}

exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = await buildProductQuery(req.query);
    const cappedLimit = Math.min(Number(limit) || 20, 200);

    const skip = (Number(page) - 1) * cappedLimit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .skip(skip)
        .limit(cappedLimit)
        .sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(products, ['sellerId']);
    await attachBrandNames(hydrated);

    res.json({ products: hydrated, pagination: { total, page: Number(page), pages: Math.ceil(total / cappedLimit), limit: cappedLimit } });
  } catch (err) {
    next(err);
  }
};

// Returns every product _id matching the current filters (not just the current page) so
// the admin UI can offer "select all N matching products" across the whole database.
exports.getAllProductIds = async (req, res, next) => {
  try {
    const query = await buildProductQuery(req.query);
    const ids = await Product.find(query).select('_id').lean();
    res.json({ ids: ids.map((p) => p._id), total: ids.length });
  } catch (err) {
    next(err);
  }
};

exports.moderateProduct = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'flagged', 'removed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid moderation status' });
    }
    let product = await Product.findByIdAndUpdate(
      req.params.id,
      { moderationStatus: status },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product = await userStore.hydrate(product, ['sellerId']);
    await attachBrandNames(product);
    res.json({ product, message: `Product ${status}` });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted permanently' });
  } catch (err) {
    next(err);
  }
};

const BULK_EDITABLE_FIELDS = [
  'category', 'subCategory', 'brand', 'priceRange', 'stock', 'minOrderQty',
  'tags', 'unit', 'location', 'lowStockThreshold', 'costPrice', 'sku',
];

exports.bulkUpdateProducts = async (req, res, next) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'No products selected' });
    if (!updates || typeof updates !== 'object') return res.status(400).json({ message: 'No updates provided' });

    const set = {};
    for (const key of BULK_EDITABLE_FIELDS) {
      if (updates[key] === undefined || updates[key] === '') continue;
      set[key] = updates[key];
    }
    if (set.category !== undefined) {
      set.category = Array.isArray(set.category) ? set.category : [set.category].filter(Boolean);
    }
    if (set.subCategory !== undefined) {
      set.subCategory = Array.isArray(set.subCategory) ? set.subCategory : [set.subCategory].filter(Boolean);
    }
    if (set.tags !== undefined) {
      set.tags = Array.isArray(set.tags)
        ? set.tags
        : String(set.tags).split(',').map((t) => t.trim()).filter(Boolean);
    }
    if (!Object.keys(set).length) return res.status(400).json({ message: 'No valid fields to update' });

    const result = await Product.updateMany({ _id: { $in: ids } }, { $set: set }, { runValidators: true });
    res.json({ message: `${result.modifiedCount} product(s) updated`, modifiedCount: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};

exports.bulkModerateProducts = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'No products selected' });
    if (!['active', 'flagged', 'removed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid moderation status' });
    }
    const result = await Product.updateMany({ _id: { $in: ids } }, { $set: { moderationStatus: status } });
    res.json({ message: `${result.modifiedCount} product(s) updated`, modifiedCount: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};

exports.bulkDeleteProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'No products selected' });
    const result = await Product.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} product(s) deleted permanently`, deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
};

// ---------- Order Management (OMS) ----------

exports.getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) query.title = new RegExp(search, 'i');

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('productId', 'images')
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

exports.getOrderById = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id).populate('productId', 'title images');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order = await userStore.hydrate(order, ['buyerId', 'sellerId']);
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, productionStage } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

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

    if (status) {
      const buyer = await userStore.getUserProfile(order.buyerId);
      if (buyer?.email) {
        sendOrderStatusUpdateEmail({
          buyerEmail: buyer.email,
          buyerName: buyer.name,
          productTitle: order.title,
          orderId: order._id,
          status: order.status,
          trackingNumber: order.trackingNumber,
          carrier: order.carrier,
        }).catch((err) => console.error('[EMAIL ERROR]', err.message));
      }
    }

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

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

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

exports.updateOrderTracking = async (req, res, next) => {
  try {
    const { trackingNumber, carrier } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.trackingNumber = trackingNumber?.trim() || order.trackingNumber || generateTrackingId(order._id);
    order.carrier = carrier?.trim() || '';
    if (order.status === 'ready') {
      order.status = 'shipped';
      order.shippedAt = new Date();
    }
    await order.save();

    const buyer = await userStore.getUserProfile(order.buyerId);
    if (buyer?.email) {
      sendOrderStatusUpdateEmail({
        buyerEmail: buyer.email,
        buyerName: buyer.name,
        productTitle: order.title,
        orderId: order._id,
        status: order.status,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
      }).catch((err) => console.error('[EMAIL ERROR]', err.message));
    }

    res.json({ order, message: 'Tracking info updated' });
  } catch (err) {
    next(err);
  }
};

// ---------- Alerts (computed live, no stored mock data) ----------

exports.getAlerts = async (req, res, next) => {
  try {
    const now = new Date();

    const [lowStockProducts, lowStockMaterials, lateOrders, pendingPayments] = await Promise.all([
      Product.find({
        moderationStatus: { $ne: 'removed' },
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      }).select('title stock lowStockThreshold updatedAt'),
      RawMaterial.find({
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      }).select('name quantity lowStockThreshold unit updatedAt'),
      Order.find({
        expectedDeliveryDate: { $lt: now },
        status: { $nin: ['delivered', 'cancelled'] },
      }).select('title expectedDeliveryDate status').sort({ expectedDeliveryDate: 1 }),
      Payment.find({ status: 'pending' })
        .select('amount buyerId createdAt')
        .sort({ createdAt: -1 }),
    ]);

    const hydratedPendingPayments = await userStore.hydrate(pendingPayments, ['buyerId']);
    const productionDelays = lateOrders.filter((o) => o.status === 'in-production');

    const alerts = [
      ...lowStockProducts.map((p) => ({
        type: 'low-stock',
        severity: 'warning',
        message: `${p.title} is low on stock (${p.stock} left, threshold ${p.lowStockThreshold})`,
        date: p.updatedAt,
        refId: p._id,
      })),
      ...lowStockMaterials.map((m) => ({
        type: 'reorder',
        severity: 'warning',
        message: `${m.name} needs reordering (${m.quantity} ${m.unit} left, threshold ${m.lowStockThreshold})`,
        date: m.updatedAt,
        refId: m._id,
      })),
      ...lateOrders.map((o) => ({
        type: 'late-order',
        severity: 'critical',
        message: `Order "${o.title}" is overdue for delivery (expected ${new Date(o.expectedDeliveryDate).toLocaleDateString()})`,
        date: o.expectedDeliveryDate,
        refId: o._id,
      })),
      ...productionDelays.map((o) => ({
        type: 'production-delay',
        severity: 'critical',
        message: `Order "${o.title}" is still in production past its delivery date`,
        date: o.expectedDeliveryDate,
        refId: o._id,
      })),
      ...hydratedPendingPayments.map((p) => ({
        type: 'payment-pending',
        severity: 'warning',
        message: `Payment of $${p.amount} from ${p.buyerId?.name || 'a buyer'} is awaiting verification`,
        date: p.createdAt,
        refId: p._id,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      alerts,
      counts: {
        lowStock: lowStockProducts.length + lowStockMaterials.length,
        lateOrders: lateOrders.length,
        productionDelays: productionDelays.length,
        pendingPayments: hydratedPendingPayments.length,
        total: alerts.length,
      },
    });
  } catch (err) {
    next(err);
  }
};
