const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const invoiceController = require('../controllers/invoiceController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Buyer routes
router.post('/', verifyToken, requireRole(['buyer']), orderController.createOrder);
router.get('/mine', verifyToken, requireRole(['buyer']), orderController.getBuyerOrders);
router.patch('/:id/cancel', verifyToken, requireRole(['buyer']), orderController.cancelOrder);
router.patch('/:id/request-cancel', verifyToken, requireRole(['buyer']), orderController.requestCancel);
router.post('/:id/reorder', verifyToken, requireRole(['buyer']), orderController.reorder);
router.get('/mine/analytics', verifyToken, requireRole(['buyer']), orderController.getBuyerAnalytics);
router.get('/:orderId/invoice', verifyToken, requireRole(['buyer']), invoiceController.getInvoiceByOrder);
router.get('/invoices/:id/pdf', verifyToken, requireRole(['buyer']), invoiceController.downloadMyInvoicePdf);

// Seller routes
router.get('/seller', verifyToken, requireRole(['seller', 'admin']), orderController.getSellerOrders);
router.get('/seller/analytics', verifyToken, requireRole(['seller', 'admin']), orderController.getSellerAnalytics);
router.patch('/:id/stage', verifyToken, requireRole(['seller', 'admin']), orderController.updateOrderStage);
router.post('/:id/updates', verifyToken, requireRole(['seller', 'admin']), orderController.addOrderUpdate);
router.patch('/:id/tracking', verifyToken, requireRole(['seller', 'admin']), orderController.updateTracking);
router.patch('/:id/cancel-request', verifyToken, requireRole(['seller', 'admin']), orderController.respondToCancelRequest);

// Admin route
router.get('/', verifyToken, requireRole(['admin']), orderController.getAllOrders);

module.exports = router;
