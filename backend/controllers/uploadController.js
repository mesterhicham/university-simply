const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { privateUploadsDir, publicUploadsDir } = require('../middleware/uploadMiddleware');

function getBaseUrl(req) {
    const host = req.get('host') || 'localhost:5000';
    const safeHost = /^[a-zA-Z0-9.:_-]+$/.test(host) ? host : 'localhost:5000';
    return process.env.BASE_URL || `${req.protocol}://${safeHost}`;
}

exports.uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a file' });
    }

    const baseUrl = getBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        url: fileUrl
    });
};

exports.uploadPrivateFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a file' });
    }

    const baseUrl = getBaseUrl(req);
    const fileUrl = `${baseUrl}/api/upload/private/${req.file.filename}`;
    res.json({
        message: 'Private file uploaded successfully',
        filename: req.file.filename,
        url: fileUrl
    });
};

// Phase 5 FIX: Authenticated, authorized private file access with Path Traversal protection
exports.downloadPrivateFile = async (req, res) => {
    try {
        const rawFilename = req.params.filename;
        if (!rawFilename) {
            return res.status(400).json({ error: 'Filename parameter is required' });
        }

        // Prevent path traversal
        const safeFilename = path.basename(rawFilename);
        const filePath = path.join(privateUploadsDir, safeFilename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Requested private document not found' });
        }

        const user = req.user;

        // Admin has universal access
        if (user.role === 'admin') {
            return res.sendFile(filePath);
        }

        // Student access: verify if document belongs to this student
        if (user.role === 'student') {
            const [studentRows] = await db.execute('SELECT id FROM students WHERE user_id = ? OR id = ?', [user.id, user.id]);
            const studentId = studentRows.length > 0 ? studentRows[0].id : null;

            // Check if file is student's payment receipt
            const [payRows] = await db.execute(
                'SELECT id FROM payments WHERE student_id = ? AND receipt_url LIKE ?',
                [studentId, `%${safeFilename}%`]
            );
            if (payRows.length > 0) {
                return res.sendFile(filePath);
            }

            // Check if file is student's assignment submission
            const [subRows] = await db.execute(
                'SELECT id FROM assignment_submissions WHERE student_id = ? AND submission_url LIKE ?',
                [studentId, `%${safeFilename}%`]
            );
            if (subRows.length > 0) {
                return res.sendFile(filePath);
            }

            // User uploaded file directly or belongs to profile
            return res.status(403).json({ error: 'Access denied: you do not have permission to view this document.' });
        }

        // Teacher access: verify if document belongs to student in teacher's assigned cohorts
        if (user.role === 'teacher') {
            const [teacherRows] = await db.execute('SELECT id FROM teachers WHERE user_id = ? OR id = ?', [user.id, user.id]);
            const teacherId = teacherRows.length > 0 ? teacherRows[0].id : null;

            // Check if submission belongs to an assignment created by this teacher
            const [subRows] = await db.execute(`
                SELECT asub.id 
                FROM assignment_submissions asub
                JOIN assignments a ON asub.assignment_id = a.id
                WHERE a.teacher_id = ? AND asub.submission_url LIKE ?
            `, [teacherId, `%${safeFilename}%`]);

            if (subRows.length > 0) {
                return res.sendFile(filePath);
            }

            return res.status(403).json({ error: 'Access denied: document not part of your assigned courses.' });
        }

        return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
    } catch (err) {
        console.error('[downloadPrivateFile]', err);
        res.status(500).json({ error: 'Failed to access private document' });
    }
};
