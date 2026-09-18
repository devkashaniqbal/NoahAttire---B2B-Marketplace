const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', categoryController.getCategories);
router.post('/', verifyToken, requireRole(['admin']), categoryController.createCategory);
router.put('/:id', verifyToken, requireRole(['admin']), categoryController.updateCategory);
router.delete('/:id', verifyToken, requireRole(['admin']), categoryController.deleteCategory);

module.exports = router;
