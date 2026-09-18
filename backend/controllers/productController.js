const Product = require('../models/Product');
const Category = require('../models/Category');
const userStore = require('../utils/userStore');
const { attachBrandNames } = require('../utils/brand');

exports.createProduct = async (req, res, next) => {
  try {
    const {
      title, sku, brand, description, images, category, subCategory, priceRange, unit, minOrderQty, location, tags,
      stock, costPrice, lowStockThreshold, sellerId, variants,
    } = req.body;

    let ownerId = req.user.userId;
    if (req.user.role === 'admin' && sellerId && sellerId !== req.user.userId) {
      const seller = await userStore.getUserProfile(sellerId);
      if (!seller || seller.role !== 'seller') return res.status(404).json({ message: 'Seller not found' });
      ownerId = sellerId;
    }

    const product = await Product.create({
      sellerId: ownerId,
      title,
      sku: sku || '',
      brand: brand || '',
      description,
      images: images || [],
      category: Array.isArray(category) ? category : [category].filter(Boolean),
      subCategory: Array.isArray(subCategory) ? subCategory : [subCategory].filter(Boolean),
      priceRange,
      unit,
      minOrderQty,
      location,
      tags: tags || [],
      stock: stock ?? 0,
      costPrice: costPrice ?? 0,
      lowStockThreshold: lowStockThreshold ?? 10,
      variants: variants || [],
    });

    res.status(201).json({ product, message: 'Product created successfully' });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, sellerId: req.user.userId };

    const updates = { ...req.body };
    if (updates.category !== undefined) {
      updates.category = Array.isArray(updates.category) ? updates.category : [updates.category].filter(Boolean);
    }
    if (updates.subCategory !== undefined) {
      updates.subCategory = Array.isArray(updates.subCategory) ? updates.subCategory : [updates.subCategory].filter(Boolean);
    }

    const product = await Product.findOneAndUpdate(filter, updates, { new: true, runValidators: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }
    res.json({ product, message: 'Product updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, sellerId: req.user.userId };

    const product = await Product.findOneAndDelete(filter);

    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getMyProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search, category } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { sellerId: req.user.userId };
    if (category) query.category = new RegExp(category, 'i');
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { brandName: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, category, subCategory, minPrice, maxPrice,
      location, search, sortBy, hasImages, tags,
    } = req.query;
    const query = { moderationStatus: { $ne: 'removed' } };

    if (category) {
      // Direct match against the category array — avoids cross-gender bleed
      // when subcategory names overlap across different parent categories.
      // subCategory param handles subcategory-level filtering separately.
      query.category = category;
    }
    if (subCategory) query.subCategory = subCategory;
    if (location) query.location = new RegExp(location, 'i');
    if (minPrice) query['priceRange.min'] = { $gte: Number(minPrice) };
    if (maxPrice) query['priceRange.max'] = { $lte: Number(maxPrice) };
    if (hasImages === 'true') query['images.0'] = { $exists: true };
    if (tags) query.tags = { $in: tags.split(',').map((t) => new RegExp(t.trim(), 'i')) };
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
      ];
    }

    const sortMap = {
      price_asc: { 'priceRange.min': 1 },
      price_desc: { 'priceRange.min': -1 },
      oldest: { createdAt: 1 },
    };
    const sort = sortMap[sortBy] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort(sort),
      Product.countDocuments(query),
    ]);
    const hydrated = await userStore.hydrate(products, ['sellerId']);
    await attachBrandNames(hydrated);

    res.json({
      products: hydrated,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const hydrated = await userStore.hydrate(product, ['sellerId']);
    await attachBrandNames(hydrated);
    res.json({ product: hydrated });
  } catch (err) {
    next(err);
  }
};

exports.getProductsBySeller = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find({ sellerId: req.params.sellerId })
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Product.countDocuments({ sellerId: req.params.sellerId }),
    ]);
    const hydrated = await userStore.hydrate(products, ['sellerId']);
    await attachBrandNames(hydrated);

    res.json({
      products: hydrated,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .limit(30)
      .sort({ createdAt: -1 });
    const hydrated = await userStore.hydrate(products, ['sellerId']);
    await attachBrandNames(hydrated);
    res.json({ products: hydrated });
  } catch (err) {
    next(err);
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ message: 'Rating and comment are required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const alreadyReviewed = product.reviews.some((r) => r.userId === req.user.userId);
    if (alreadyReviewed) return res.status(400).json({ message: 'You have already reviewed this product' });

    const profile = await userStore.getUserProfile(req.user.userId);
    const userName = profile?.name || 'Anonymous';

    product.reviews.push({ userId: req.user.userId, userName, rating: Number(rating), comment });
    product.reviewCount = product.reviews.length;
    product.avgRating = Math.round((product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length) * 10) / 10;
    await product.save();

    res.status(201).json({ message: 'Review added', avgRating: product.avgRating, reviewCount: product.reviewCount });
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (req.user.role !== 'admin' && review.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    product.reviews.pull(req.params.reviewId);
    product.reviewCount = product.reviews.length;
    product.avgRating = product.reviews.length
      ? Math.round((product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length) * 10) / 10
      : 0;
    await product.save();

    res.json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const [allCategories, counts] = await Promise.all([
      Category.find().sort({ order: 1, name: 1 }),
      Product.aggregate([{ $unwind: '$category' }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);
    const countMap = {};
    counts.forEach(({ _id, count }) => { countMap[_id] = count; });
    const categories = allCategories.map((c) => ({ name: c.name, icon: c.icon, count: countMap[c.name] || 0 }));
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};
