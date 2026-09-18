const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/', verifyToken, requireRole(['buyer']), supportController.createTicket);
router.get('/mine', verifyToken, requireRole(['buyer']), supportController.getMyTickets);
router.get('/:id', verifyToken, requireRole(['buyer', 'admin']), supportController.getTicket);
router.patch('/:id/status', verifyToken, requireRole(['admin']), supportController.updateTicketStatus);

module.exports = router;
