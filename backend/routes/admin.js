const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/authMiddleware');

// C5 FIX: All routes now require authentication (settings was previously public)
// Protected routes
router.use(auth);

// Meetings routes (available to authenticated users depending on role)
router.get('/settings', adminController.getSettings); // C5 FIX: Now requires auth
router.get('/zoom/teacher-meetings', authorize('admin', 'teacher'), adminController.getTeacherMeetings);
router.get('/zoom/student-meetings', authorize('admin', 'student'), adminController.getStudentMeetings);
router.post('/zoom/meetings/:id/open', authorize('admin', 'teacher'), adminController.toggleRoomOpen);

// Admin-only routes
router.use(authorize('admin'));

router.post('/settings', adminController.updateSetting);

// Users Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Payment Account Settings
router.get('/payment-settings', adminController.getPaymentAccountSettings);
router.post('/payment-settings', adminController.savePaymentAccountSettings);

// Holidays
router.get('/holidays', adminController.getHolidays);
router.post('/holidays', adminController.createHoliday);
router.put('/holidays/:id', adminController.updateHoliday);
router.delete('/holidays/:id', adminController.deleteHoliday);

// News
router.get('/news', adminController.getNews);
router.post('/news', adminController.createNews);
router.put('/news/:id', adminController.updateNews);
router.delete('/news/:id', adminController.deleteNews);

// Email Management
router.get('/email/settings', adminController.getEmailSettings);
router.post('/email/settings', adminController.saveEmailSettings);
router.get('/email/templates', adminController.getEmailTemplates);
router.put('/email/templates/:id', adminController.updateEmailTemplate);
router.get('/email/logs', adminController.getEmailLogs);
router.post('/email/test', adminController.sendTestEmail);

module.exports = router;
