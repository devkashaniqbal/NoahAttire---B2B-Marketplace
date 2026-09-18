const SellerProfile = require('../models/SellerProfile');
const userStore = require('../utils/userStore');

exports.getMyProfile = async (req, res, next) => {
  try {
    let profile = await SellerProfile.findOne({ userId: req.user.userId });
    if (!profile && req.user.role === 'admin') {
      profile = await SellerProfile.create({
        userId: req.user.userId,
        businessName: 'Admin Store',
        approvalStatus: 'approved',
        isActive: true,
      });
    }
    if (!profile) return res.status(404).json({ message: 'Seller profile not found' });
    const hydrated = await userStore.hydrate(profile, ['userId']);
    res.json({ profile: hydrated });
  } catch (err) {
    next(err);
  }
};

exports.updateMyProfile = async (req, res, next) => {
  try {
    const { businessName, logo, description, category, location, phone, website } = req.body;

    const profile = await SellerProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { businessName, logo, description, category, location, phone, website },
      { new: true, runValidators: true }
    );

    if (!profile) return res.status(404).json({ message: 'Seller profile not found' });
    const hydrated = await userStore.hydrate(profile, ['userId']);
    res.json({ profile: hydrated, message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getSellerById = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Seller not found' });
    const hydrated = await userStore.hydrate(profile, ['userId']);
    res.json({ profile: hydrated });
  } catch (err) {
    next(err);
  }
};

exports.getSellerByUserId = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.params.userId });
    if (!profile) return res.status(404).json({ message: 'Seller not found' });
    const hydrated = await userStore.hydrate(profile, ['userId']);
    res.json({ profile: hydrated });
  } catch (err) {
    next(err);
  }
};

exports.getAllSellers = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [sellers, total] = await Promise.all([
      SellerProfile.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      SellerProfile.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(sellers, ['userId']);

    res.json({
      sellers: hydrated,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getFeaturedSellers = async (req, res, next) => {
  try {
    const sellers = await SellerProfile.find({ isActive: true, businessName: { $ne: '' } })
      .limit(6)
      .sort({ createdAt: -1 });
    const hydrated = await userStore.hydrate(sellers, ['userId']);
    res.json({ sellers: hydrated });
  } catch (err) {
    next(err);
  }
};
