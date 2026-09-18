const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

router.get('/:threadType/:threadId', verifyToken, messageController.getThread);
router.post('/:threadType/:threadId', verifyToken, messageController.postMessage);

module.exports = router;
