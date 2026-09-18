const express = require('express');
const router = express.Router();
const savedSellerController = require('../controllers/savedSellerController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole(['buyer']));

router.get('/', savedSellerController.getSavedSellers);
router.get('/compare', savedSellerController.compareSellers);
router.post('/', savedSellerController.saveSeller);
router.delete('/:sellerId', savedSellerController.unsaveSeller);
router.post('/:sellerId/rate', savedSellerController.rateSeller);

module.exports = router;
