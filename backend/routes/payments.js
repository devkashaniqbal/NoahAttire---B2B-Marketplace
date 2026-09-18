const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Buyer routes
router.post('/', verifyToken, requireRole(['buyer']), paymentController.createPayment);
router.get('/mine', verifyToken, requireRole(['buyer']), paymentController.getBuyerPayments);

// Seller routes
router.get('/seller', verifyToken, requireRole(['seller', 'admin']), paymentController.getSellerPayments);
router.patch('/:id/verify', verifyToken, requireRole(['seller', 'admin']), paymentController.verifyPayment);

module.exports = router;
