const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', siteSettingsController.getSettings);
router.put('/', verifyToken, requireRole(['admin']), siteSettingsController.updateSettings);

module.exports = router;
