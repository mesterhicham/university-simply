const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { auth, authorize } = require('../middleware/authMiddleware');

// --- Placement Test Status (Enable/Disable) ---
router.get('/status', testController.getPlacementTestStatus);

router.use(auth);

// --- Placement Test Status Toggle (Admin Only) ---
router.post('/status', authorize('admin'), testController.updatePlacementTestStatus);

// --- Public/Student Placement Test ---
router.get('/questions', testController.getPlacementQuestions);
router.get('/result', authorize('student'), testController.getStudentTestResult);
router.post('/submit', authorize('student'), testController.submitTest);

// --- Admin Placement Test Management ---
router.get('/all-questions', authorize('admin'), testController.getAllQuestions);
router.post('/questions', authorize('admin'), testController.createQuestion);
router.put('/questions/:id', authorize('admin'), testController.updateQuestion);
router.delete('/questions/:id', authorize('admin'), testController.deleteQuestion);
router.get('/all-results', authorize('admin'), testController.getAllTestResults);
router.post('/seed-samples', authorize('admin'), testController.seedSampleQuestions);

module.exports = router;
