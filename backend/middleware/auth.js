const jwt = require('jsonwebtoken');
const userStore = require('../utils/userStore');

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const profile = await userStore.getUserProfile(decoded.userId);

    if (!profile) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (profile.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned' });
    }

    req.user = { userId: profile.uid, role: profile.role, email: profile.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const profile = await userStore.getUserProfile(decoded.userId);

    if (profile && !profile.isBanned) {
      req.user = { userId: profile.uid, role: profile.role, email: profile.email };
    }
    next();
  } catch {
    next();
  }
};

exports.requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};
