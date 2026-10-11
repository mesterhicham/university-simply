const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/change-password', auth, authController.changePassword);

// First Admin Setup
router.get('/check-admin', authController.checkAdminExists);
router.post('/setup-admin', auth, authController.setupFirstAdmin);

// WhatsApp OTP
router.post('/whatsapp/send-otp', authController.sendWhatsAppOtp);
router.post('/whatsapp/verify-otp', authController.verifyWhatsAppOtp);

module.exports = router;
