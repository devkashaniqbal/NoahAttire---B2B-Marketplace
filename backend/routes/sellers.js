const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protected seller routes — must come BEFORE /:id to prevent "me" matching as an ID
router.get('/me/profile', verifyToken, requireRole(['seller', 'admin']), sellerController.getMyProfile);
router.put('/me/profile', verifyToken, requireRole(['seller', 'admin']), sellerController.updateMyProfile);

// Public routes
router.get('/', sellerController.getAllSellers);
router.get('/featured', sellerController.getFeaturedSellers);
router.get('/user/:userId', sellerController.getSellerByUserId);
router.get('/:id', sellerController.getSellerById);

module.exports = router;
