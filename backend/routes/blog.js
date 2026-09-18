const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { verifyToken, optionalAuth, requireRole } = require('../middleware/auth');

router.get('/', optionalAuth, blogController.getBlogs);
router.get('/:slug', optionalAuth, blogController.getBlogBySlug);

router.post('/', verifyToken, requireRole(['admin']), blogController.createBlog);
router.put('/:id', verifyToken, requireRole(['admin']), blogController.updateBlog);
router.delete('/:id', verifyToken, requireRole(['admin']), blogController.deleteBlog);

module.exports = router;
