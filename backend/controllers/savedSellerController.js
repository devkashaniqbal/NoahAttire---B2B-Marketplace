const SavedSeller = require('../models/SavedSeller');
const Order = require('../models/Order');
const RFQ = require('../models/RFQ');
const userStore = require('../utils/userStore');

exports.saveSeller = async (req, res, next) => {
  try {
    const { sellerId } = req.body;
    if (!sellerId) return res.status(400).json({ message: 'sellerId is required' });

    const seller = await userStore.getUserProfile(sellerId);
    if (!seller || seller.role !== 'seller') return res.status(404).json({ message: 'Seller not found' });

    const saved = await SavedSeller.findOneAndUpdate(
      { buyerId: req.user.userId, sellerId },
      { $setOnInsert: { buyerId: req.user.userId, sellerId } },
      { upsert: true, new: true }
    );

    res.status(201).json({ saved, message: 'Seller saved' });
  } catch (err) {
    next(err);
  }
};

exports.unsaveSeller = async (req, res, next) => {
  try {
    await SavedSeller.findOneAndDelete({ buyerId: req.user.userId, sellerId: req.params.sellerId });
    res.json({ message: 'Seller removed from saved list' });
  } catch (err) {
    next(err);
  }
};

exports.rateSeller = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const r = Number(rating);
    if (!r || r < 1 || r > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const saved = await SavedSeller.findOneAndUpdate(
      { buyerId: req.user.userId, sellerId: req.params.sellerId },
      { rating: r, review: review || '' },
      { upsert: true, new: true }
    );

    res.json({ saved, message: 'Rating submitted' });
  } catch (err) {
    next(err);
  }
};

exports.getSavedSellers = async (req, res, next) => {
  try {
    const saved = await SavedSeller.find({ buyerId: req.user.userId }).sort({ createdAt: -1 });
    const hydrated = await userStore.hydrate(saved, ['sellerId']);

    // Performance stats per seller: order count, on-time delivery rate, total spend
    const performance = await Order.aggregate([
      { $match: { buyerId: req.user.userId } },
      {
        $group: {
          _id: '$sellerId',
          totalOrders: { $sum: 1 },
          totalSpend: { $sum: '$totalAmount' },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          onTime: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'delivered'] }, { $lte: ['$deliveredAt', '$expectedDeliveryDate'] }] },
                1, 0,
              ],
            },
          },
        },
      },
    ]);
    const perfMap = {};
    performance.forEach((p) => { perfMap[p._id] = p; });

    const result = hydrated.map((s) => {
      const perf = perfMap[s.sellerId._id] || { totalOrders: 0, totalSpend: 0, delivered: 0, onTime: 0 };
      return {
        ...s,
        performance: {
          totalOrders: perf.totalOrders,
          totalSpend: perf.totalSpend,
          onTimeRate: perf.delivered ? Math.round((perf.onTime / perf.delivered) * 100) : null,
        },
      };
    });

    res.json({ sellers: result });
  } catch (err) {
    next(err);
  }
};

exports.compareSellers = async (req, res, next) => {
  try {
    const { sellerIds } = req.query;
    const ids = (sellerIds || '').split(',').filter(Boolean);
    if (ids.length < 2) return res.status(400).json({ message: 'Select at least 2 sellers to compare' });

    const [sellerProfiles, savedRatings, orderStats, rfqStats] = await Promise.all([
      userStore.getUserProfiles(ids),
      SavedSeller.find({ buyerId: req.user.userId, sellerId: { $in: ids } }),
      Order.aggregate([
        { $match: { sellerId: { $in: ids } } },
        { $group: { _id: '$sellerId', totalOrders: { $sum: 1 }, totalSpend: { $sum: '$totalAmount' } } },
      ]),
      RFQ.aggregate([
        { $match: { sellerId: { $in: ids } } },
        { $group: { _id: '$sellerId', avgLeadTime: { $avg: '$quote.leadTimeDays' }, quoteCount: { $sum: 1 } } },
      ]),
    ]);

    const sellers = ids.map((id) => sellerProfiles[id]).filter((s) => s && s.role === 'seller');

    const ratingMap = {};
    savedRatings.forEach((s) => { ratingMap[s.sellerId] = s.rating; });
    const orderMap = {};
    orderStats.forEach((o) => { orderMap[o._id] = o; });
    const rfqMap = {};
    rfqStats.forEach((r) => { rfqMap[r._id] = r; });

    const comparison = sellers.map((s) => ({
      seller: s,
      rating: ratingMap[s.uid] || null,
      totalOrders: orderMap[s.uid]?.totalOrders || 0,
      totalSpend: orderMap[s.uid]?.totalSpend || 0,
      avgLeadTimeDays: rfqMap[s.uid]?.avgLeadTime || null,
    }));

    res.json({ comparison });
  } catch (err) {
    next(err);
  }
};
