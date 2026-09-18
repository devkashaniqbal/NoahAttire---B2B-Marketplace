const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productionController = require('../controllers/productionController');
const inventoryController = require('../controllers/inventoryController');
const financeController = require('../controllers/financeController');
const invoiceController = require('../controllers/invoiceController');
const { verifyToken, requireRole } = require('../middleware/auth');

const adminOnly = [verifyToken, requireRole(['admin'])];

router.get('/stats', ...adminOnly, adminController.getStats);

router.get('/users', ...adminOnly, adminController.getAllUsers);
router.patch('/users/:id/ban', ...adminOnly, adminController.banUser);
router.patch('/users/:id/unban', ...adminOnly, adminController.unbanUser);

router.get('/sellers', ...adminOnly, adminController.getAllSellers);
router.patch('/sellers/:id/approve', ...adminOnly, adminController.approveSeller);
router.patch('/sellers/:id/reject', ...adminOnly, adminController.rejectSeller);
router.patch('/sellers/:id/suspend', ...adminOnly, adminController.suspendSeller);
router.patch('/sellers/:id/reactivate', ...adminOnly, adminController.reactivateSeller);

router.get('/products', ...adminOnly, adminController.getAllProducts);
router.get('/products/ids', ...adminOnly, adminController.getAllProductIds);
router.patch('/products/bulk', ...adminOnly, adminController.bulkUpdateProducts);
router.patch('/products/bulk/moderate', ...adminOnly, adminController.bulkModerateProducts);
router.delete('/products/bulk', ...adminOnly, adminController.bulkDeleteProducts);
router.patch('/products/:id/moderate', ...adminOnly, adminController.moderateProduct);
router.delete('/products/:id', ...adminOnly, adminController.deleteProduct);

// Order Management (OMS)
router.get('/orders', ...adminOnly, adminController.getOrders);
router.get('/orders/:id', ...adminOnly, adminController.getOrderById);
router.patch('/orders/:id/status', ...adminOnly, adminController.updateOrderStatus);
router.post('/orders/:id/updates', ...adminOnly, adminController.addOrderUpdate);
router.patch('/orders/:id/tracking', ...adminOnly, adminController.updateOrderTracking);

// Alerts (computed live)
router.get('/alerts', ...adminOnly, adminController.getAlerts);

// Production Management
router.get('/production/overview', ...adminOnly, productionController.getOverview);
router.get('/workers', ...adminOnly, productionController.getWorkers);
router.post('/workers', ...adminOnly, productionController.createWorker);
router.patch('/workers/:id', ...adminOnly, productionController.updateWorker);
router.delete('/workers/:id', ...adminOnly, productionController.deleteWorker);
router.get('/production/assignments', ...adminOnly, productionController.getAssignments);
router.post('/production/assignments', ...adminOnly, productionController.createAssignment);
router.delete('/production/assignments/:id', ...adminOnly, productionController.deleteAssignment);

// Inventory
router.get('/raw-materials', ...adminOnly, inventoryController.getRawMaterials);
router.post('/raw-materials', ...adminOnly, inventoryController.createRawMaterial);
router.patch('/raw-materials/:id', ...adminOnly, inventoryController.updateRawMaterial);
router.post('/raw-materials/:id/transaction', ...adminOnly, inventoryController.addTransaction);
router.delete('/raw-materials/:id', ...adminOnly, inventoryController.deleteRawMaterial);
router.get('/inventory/finished-goods', ...adminOnly, inventoryController.getFinishedGoods);

// Finance
router.get('/expenses', ...adminOnly, financeController.getExpenses);
router.post('/expenses', ...adminOnly, financeController.createExpense);
router.patch('/expenses/:id', ...adminOnly, financeController.updateExpense);
router.delete('/expenses/:id', ...adminOnly, financeController.deleteExpense);
router.get('/finance/summary', ...adminOnly, financeController.getSummary);

// Invoices
router.get('/invoices', ...adminOnly, invoiceController.getInvoices);
router.post('/invoices/generate/:orderId', ...adminOnly, invoiceController.generateInvoice);
router.get('/invoices/:id/pdf', ...adminOnly, invoiceController.downloadInvoicePdf);

module.exports = router;
