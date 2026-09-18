const jwt = require('jsonwebtoken');
const SellerProfile = require('../models/SellerProfile');
const { verifyFirebaseToken } = require('../config/firebaseAdmin');
const userStore = require('../utils/userStore');

const signToken = (uid, role) =>
  jwt.sign({ userId: uid, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Cookie security is tied to whether we're actually served over HTTPS, not just NODE_ENV —
// secure cookies are silently dropped by browsers over plain HTTP (e.g. an IP-only deploy with no SSL yet).
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

const setCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SECURE ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Firebase auth — verify Firebase ID token, create/sync the Firestore profile, issue our session cookie
exports.firebaseAuth = async (req, res, next) => {
  try {
    const { idToken, name, role, fcmToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Firebase ID token required' });

    const decoded = await verifyFirebaseToken(idToken);
    const { uid, email, name: fbName, picture } = decoded;

    let profile = await userStore.getUserProfile(uid);

    if (!profile) {
      const allowedRole = ['buyer', 'seller'].includes(role) ? role : 'buyer';
      profile = await userStore.createUserProfile(uid, {
        name: name || fbName || email.split('@')[0],
        email,
        role: allowedRole,
        photoURL: picture || null,
        fcmToken: fcmToken || null,
      });
      if (allowedRole === 'seller') {
        await SellerProfile.create({ userId: uid });
      }
    } else {
      const updates = {};
      if (fcmToken && fcmToken !== profile.fcmToken) updates.fcmToken = fcmToken;
      if (picture && !profile.photoURL) updates.photoURL = picture;
      if (Object.keys(updates).length) profile = await userStore.updateUserProfile(uid, updates);
    }

    if (profile.isBanned) return res.status(403).json({ message: 'Your account has been suspended' });

    const token = signToken(uid, profile.role);
    setCookie(res, token);

    res.json({
      message: 'Authentication successful',
      user: { _id: uid, name: profile.name, email: profile.email, role: profile.role, photoURL: profile.photoURL },
    });
  } catch (err) {
    if (typeof err.code === 'string' && err.code.startsWith('auth/')) {
      return res.status(401).json({ message: 'Invalid Firebase token' });
    }
    next(err);
  }
};

// Save / refresh FCM token for push notifications
exports.saveFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ message: 'FCM token required' });
    await userStore.updateUserProfile(req.user.userId, { fcmToken });
    res.json({ message: 'FCM token saved' });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SECURE ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out successfully' });
};

exports.me = async (req, res, next) => {
  try {
    const profile = await userStore.getUserProfile(req.user.userId);
    if (!profile) return res.status(404).json({ message: 'User not found' });
    res.json({ user: profile });
  } catch (err) {
    next(err);
  }
};

const EDITABLE_FIELDS = [
  'name', 'companyName', 'taxId', 'companyAddresses', 'notificationSettings',
];

exports.updateMe = async (req, res, next) => {
  try {
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    const profile = await userStore.updateUserProfile(req.user.userId, updates);
    res.json({ user: profile, message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};

exports.addDocument = async (req, res, next) => {
  try {
    const { name, url } = req.body;
    if (!name?.trim() || !url?.trim()) {
      return res.status(400).json({ message: 'Document name and url are required' });
    }
    const profile = await userStore.getUserProfile(req.user.userId);
    const documents = [...(profile.documents || []), { name: name.trim(), url: url.trim(), uploadedAt: new Date() }];
    const updated = await userStore.updateUserProfile(req.user.userId, { documents });
    res.status(201).json({ user: updated, message: 'Document uploaded' });
  } catch (err) {
    next(err);
  }
};

exports.toggleSavedProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const profile = await userStore.getUserProfile(req.user.userId);
    const saved = profile.savedProducts || [];
    const idx = saved.indexOf(productId);
    const savedProducts = idx >= 0
      ? saved.filter((id) => id !== productId)
      : [...saved, productId];
    await userStore.updateUserProfile(req.user.userId, { savedProducts });
    res.json({ savedProducts, message: idx >= 0 ? 'Removed from saved products' : 'Added to saved products' });
  } catch (err) {
    next(err);
  }
};

exports.getSavedProducts = async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const profile = await userStore.getUserProfile(req.user.userId);
    const products = await Product.find({ _id: { $in: profile.savedProducts || [] } });
    res.json({ products });
  } catch (err) {
    next(err);
  }
};
