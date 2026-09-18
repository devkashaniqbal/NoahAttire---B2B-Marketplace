const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/firebase', authController.firebaseAuth);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.me);
router.patch('/me', verifyToken, authController.updateMe);
router.post('/me/documents', verifyToken, authController.addDocument);
router.get('/me/saved-products', verifyToken, authController.getSavedProducts);
router.post('/me/saved-products/:productId', verifyToken, authController.toggleSavedProduct);
router.post('/fcm-token', verifyToken, authController.saveFcmToken);

module.exports = router;
