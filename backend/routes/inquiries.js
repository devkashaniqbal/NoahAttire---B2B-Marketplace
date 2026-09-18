const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/auth');

// Guest + buyer — optionalAuth attaches user if logged in
router.post('/', optionalAuth, inquiryController.createInquiry);

// Buyer routes
router.get('/buyer', verifyToken, requireRole(['buyer']), inquiryController.getBuyerInquiries);

// Seller (and admin) routes
router.get('/mine', verifyToken, requireRole(['seller', 'admin']), inquiryController.getSellerInquiries);
router.patch('/:id/status', verifyToken, requireRole(['seller', 'admin']), inquiryController.updateInquiryStatus);
router.post('/:id/reply', verifyToken, requireRole(['seller', 'admin']), inquiryController.replyToInquiry);

// Admin route
router.get('/', verifyToken, requireRole(['admin']), inquiryController.getAllInquiries);

module.exports = router;
