const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { publicUpload, privateUpload, validateMagicBytes } = require('../middleware/uploadMiddleware');
const { auth } = require('../middleware/authMiddleware');

// Public upload route (avatars, banners, course thumbnails)
router.post('/', auth, (req, res, next) => {
    publicUpload.single('file')(req, res, (err) => {
        if (err) {
            console.error('[Public Upload Error]:', err.message);
            return res.status(400).json({ error: err.message || 'File upload failed' });
        }
        next();
    });
}, validateMagicBytes, uploadController.uploadFile);

// Private upload route (sensitive student documents, payment receipts, submissions)
router.post('/private', auth, (req, res, next) => {
    privateUpload.single('file')(req, res, (err) => {
        if (err) {
            console.error('[Private Upload Error]:', err.message);
            return res.status(400).json({ error: err.message || 'Private file upload failed' });
        }
        next();
    });
}, validateMagicBytes, uploadController.uploadPrivateFile);

// Authenticated, authorized private file access endpoint
router.get('/private/:filename', auth, uploadController.downloadPrivateFile);

module.exports = router;
