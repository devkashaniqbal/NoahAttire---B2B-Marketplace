const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken, requireRole } = require('../middleware/auth');

const sellerOnly = [verifyToken, requireRole(['seller', 'admin'])];

router.get('/', ...sellerOnly, supplierController.getMySuppliers);
router.post('/', ...sellerOnly, supplierController.createSupplier);
router.put('/:id', ...sellerOnly, supplierController.updateSupplier);
router.delete('/:id', ...sellerOnly, supplierController.deleteSupplier);

module.exports = router;
