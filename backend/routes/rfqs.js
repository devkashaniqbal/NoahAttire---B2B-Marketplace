const express = require('express');
const router = express.Router();
const rfqController = require('../controllers/rfqController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Buyer routes
router.post('/', verifyToken, requireRole(['buyer']), rfqController.createRFQ);
router.post('/group', verifyToken, requireRole(['buyer']), rfqController.createRFQGroup);
router.get('/group/:groupId', verifyToken, requireRole(['buyer']), rfqController.getRFQGroup);
router.get('/mine', verifyToken, requireRole(['buyer']), rfqController.getBuyerRFQs);
router.patch('/:id/accept', verifyToken, requireRole(['buyer']), rfqController.acceptQuote);
router.patch('/:id/reject', verifyToken, requireRole(['buyer']), rfqController.rejectQuote);

// Seller routes
router.get('/seller', verifyToken, requireRole(['seller', 'admin']), rfqController.getSellerRFQs);
router.patch('/:id/quote', verifyToken, requireRole(['seller', 'admin']), rfqController.submitQuote);

module.exports = router;
