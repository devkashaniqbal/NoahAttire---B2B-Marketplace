const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/', verifyToken, requireRole(['buyer']), returnController.createReturnRequest);
router.get('/mine', verifyToken, requireRole(['buyer']), returnController.getMyReturnRequests);
router.get('/seller', verifyToken, requireRole(['seller', 'admin']), returnController.getSellerReturnRequests);
router.patch('/:id/action', verifyToken, requireRole(['seller', 'admin']), returnController.actOnReturnRequest);

module.exports = router;
