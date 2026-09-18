const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Specific named routes MUST come before /:id to avoid being swallowed
router.get('/featured', productController.getFeaturedProducts);
router.get('/categories', productController.getCategories);
router.get('/me/list', verifyToken, requireRole(['seller', 'admin']), productController.getMyProducts);
router.get('/seller/:sellerId', productController.getProductsBySeller);

// Wildcard param route last
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Reviews
router.post('/:id/reviews', verifyToken, requireRole(['buyer']), productController.addReview);
router.delete('/:id/reviews/:reviewId', verifyToken, productController.deleteReview);

// Seller (and admin) mutations
router.post('/', verifyToken, requireRole(['seller', 'admin']), productController.createProduct);
router.put('/:id', verifyToken, requireRole(['seller', 'admin']), productController.updateProduct);
router.delete('/:id', verifyToken, requireRole(['seller', 'admin']), productController.deleteProduct);

module.exports = router;
