const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/', verifyToken, requireRole(['buyer']), procurementController.createRequest);
router.get('/mine', verifyToken, requireRole(['buyer']), procurementController.getMyRequests);
router.patch('/:id/action', verifyToken, requireRole(['buyer']), procurementController.actOnRequest);

module.exports = router;
