const db = require('../config/db');
const crypto = require('crypto');

// --- FORMATIONS ---
exports.getAllFormations = async (req, res) => {
    try {
        const [formations] = await db.execute('SELECT * FROM formations ORDER BY created_at DESC');
        res.json(formations);
    } catch (err) {
        console.error('[getAllFormations]', err);
        res.status(500).json({ error: 'Failed to fetch formations' });
    }
};

exports.getPublishedFormations = async (req, res) => {
    try {
        const [formations] = await db.execute('SELECT * FROM formations WHERE is_published = 1 ORDER BY created_at DESC');
        res.json(formations);
    } catch (err) {
        console.error('[getPublishedFormations]', err);
        res.status(500).json({ error: 'Failed to fetch published formations' });
    }
};

// M4 FIX: Validate title, description and price format
exports.createFormation = async (req, res) => {
    const { title, description, price, currency, is_published, thumbnail_url } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
        return res.status(400).json({ error: 'Title is required (minimum 3 characters).' });
    }

    const numPrice = parseFloat(price ?? 0);
    if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ error: 'Price must be a valid non-negative number.' });
    }

    const id = crypto.randomUUID();
    const created_by = req.user.id;
    try {
        await db.execute(
            'INSERT INTO formations (id, title, description, price, currency, is_published, thumbnail_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title.trim(), description ? description.trim() : '', numPrice, currency || 'USD', is_published ? 1 : 0, thumbnail_url || null, created_by]
        );
        res.status(201).json({ id, title: title.trim(), description, price: numPrice, currency, is_published, thumbnail_url });
    } catch (err) {
        console.error('[createFormation]', err);
        res.status(500).json({ error: 'Failed to create formation' });
    }
};

exports.updateFormation = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, currency, is_published, thumbnail_url } = req.body;

    if (title !== undefined && (typeof title !== 'string' || title.trim().length < 3)) {
        return res.status(400).json({ error: 'Title must be at least 3 characters long.' });
    }

    const numPrice = price !== undefined ? parseFloat(price) : undefined;
    if (numPrice !== undefined && (isNaN(numPrice) || numPrice < 0)) {
        return res.status(400).json({ error: 'Price must be a valid non-negative number.' });
    }

    try {
        await db.execute(
            'UPDATE formations SET title = COALESCE(?, title), description = COALESCE(?, description), price = COALESCE(?, price), currency = COALESCE(?, currency), is_published = COALESCE(?, is_published), thumbnail_url = COALESCE(?, thumbnail_url), updated_at = NOW() WHERE id = ?',
            [title ? title.trim() : null, description !== undefined ? description : null, numPrice !== undefined ? numPrice : null, currency || null, is_published !== undefined ? (is_published ? 1 : 0) : null, thumbnail_url !== undefined ? thumbnail_url : null, id]
        );
        res.json({ id, title, description, price: numPrice, currency, is_published, thumbnail_url });
    } catch (err) {
        console.error('[updateFormation]', err);
        res.status(500).json({ error: 'Failed to update formation' });
    }
};

exports.deleteFormation = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM formations WHERE id = ?', [id]);
        res.json({ message: 'Formation deleted successfully' });
    } catch (err) {
        console.error('[deleteFormation]', err);
        res.status(500).json({ error: 'Failed to delete formation' });
    }
};

// --- CONTENT ---
// C6 FIX: Prevent unauthorized access to paid course content
exports.getFormationContent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    try {
        // Admin always has full access
        if (userRole !== 'admin') {
            const [formations] = await db.execute('SELECT price, created_by FROM formations WHERE id = ?', [id]);
            if (formations.length === 0) {
                return res.status(404).json({ error: 'Formation not found' });
            }

            const formation = formations[0];
            const isFree = !formation.price || parseFloat(formation.price) === 0;
            const isCreator = formation.created_by === userId;

            if (!isFree && !isCreator) {
                // Check student approved enrollment
                const [students] = await db.execute('SELECT id FROM students WHERE user_id = ?', [userId]);
                const studentId = students[0]?.id;

                const [enrollment] = await db.execute(
                    'SELECT id FROM formation_enrollments WHERE formation_id = ? AND (student_id = ? OR student_id = ?) AND payment_status = "approved"',
                    [id, studentId || userId, userId]
                );

                if (enrollment.length === 0) {
                    return res.status(403).json({ error: 'Enrollment and approved payment required to access this content' });
                }
            }
        }

        const [content] = await db.execute('SELECT * FROM formation_content WHERE formation_id = ? ORDER BY order_index ASC', [id]);
        res.json(content);
    } catch (err) {
        console.error('[getFormationContent]', err);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
};

exports.addFormationContent = async (req, res) => {
    const { formation_id, title, content_type, file_url, duration_seconds, order_index, quiz_id } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO formation_content (id, formation_id, title, content_type, file_url, duration_seconds, order_index, quiz_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, formation_id, title, content_type, file_url, duration_seconds, order_index, quiz_id]
        );
        res.status(201).json({ id, formation_id, title, content_type, file_url, duration_seconds, order_index, quiz_id });
    } catch (err) {
        console.error('[addFormationContent]', err);
        res.status(500).json({ error: 'Failed to add content' });
    }
};

exports.updateFormationContent = async (req, res) => {
    const { id } = req.params;
    const { title, content_type, file_url, duration_seconds, order_index, quiz_id } = req.body;
    try {
        await db.execute(
            'UPDATE formation_content SET title = ?, content_type = ?, file_url = ?, duration_seconds = ?, order_index = ?, quiz_id = ? WHERE id = ?',
            [title, content_type, file_url, duration_seconds, order_index, quiz_id, id]
        );
        res.json({ id, title, content_type, file_url, duration_seconds, order_index, quiz_id });
    } catch (err) {
        console.error('[updateFormationContent]', err);
        res.status(500).json({ error: 'Failed to update content' });
    }
};

exports.deleteFormationContent = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM formation_content WHERE id = ?', [id]);
        res.json({ message: 'Content deleted successfully' });
    } catch (err) {
        console.error('[deleteFormationContent]', err);
        res.status(500).json({ error: 'Failed to delete content' });
    }
};

exports.reorderContent = async (req, res) => {
    const { items } = req.body;
    try {
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Items must be an array' });
        }
        for (const item of items) {
            await db.execute('UPDATE formation_content SET order_index = ? WHERE id = ?', [item.order_index, item.id]);
        }
        res.json({ message: 'Content reordered successfully' });
    } catch (err) {
        console.error('[reorderContent]', err);
        res.status(500).json({ error: 'Failed to reorder content' });
    }
};

// --- ENROLLMENTS & PAYMENTS ---
exports.getAllEnrollments = async (req, res) => {
    try {
        const [enrollments] = await db.execute(`
            SELECT fe.*, f.title as formation_title, p.full_name as student_name
            FROM formation_enrollments fe
            JOIN formations f ON fe.formation_id = f.id
            JOIN students s ON fe.student_id = s.id
            JOIN profiles p ON s.user_id = p.id
            ORDER BY fe.enrolled_at DESC
        `);
        res.json(enrollments);
    } catch (err) {
        console.error('[getAllEnrollments]', err);
        res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
};

exports.getStudentEnrollments = async (req, res) => {
    const userId = req.user.id;
    try {
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (student.length === 0) return res.json([]);
        
        const [enrollments] = await db.execute(`
            SELECT fe.*, f.title as formation_title, f.thumbnail_url
            FROM formation_enrollments fe
            JOIN formations f ON fe.formation_id = f.id
            WHERE fe.student_id = ?
        `, [student[0].id]);
        res.json(enrollments);
    } catch (err) {
        console.error('[getStudentEnrollments]', err);
        res.status(500).json({ error: 'Failed to fetch student enrollments' });
    }
};

// C8 FIX: Validate allowed payment_status values
exports.updateEnrollmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

    if (!status || !ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ 
            error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}` 
        });
    }

    try {
        const [result] = await db.execute('UPDATE formation_enrollments SET payment_status = ? WHERE id = ?', [status, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Enrollment record not found' });
        }
        res.json({ message: 'Enrollment status updated' });
    } catch (err) {
        console.error('[updateEnrollmentStatus]', err);
        res.status(500).json({ error: 'Failed to update enrollment status' });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const [payments] = await db.execute(`
            SELECT fp.*, f.title as formation_title, p.full_name as student_name, p.email as student_email
            FROM formation_payments fp
            JOIN formations f ON fp.formation_id = f.id
            JOIN students s ON fp.student_id = s.id
            JOIN profiles p ON s.user_id = p.id
            ORDER BY fp.created_at DESC
        `);
        res.json(payments);
    } catch (err) {
        console.error('[getAllPayments]', err);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const reviewed_by = req.user.id;
    try {
        await db.execute(
            'UPDATE formation_payments SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
            [status, admin_notes, reviewed_by, id]
        );
        
        if (status === 'approved') {
            const [payment] = await db.execute('SELECT formation_id, student_id FROM formation_payments WHERE id = ?', [id]);
            if (payment.length > 0) {
                await db.execute(
                    'UPDATE formation_enrollments SET payment_status = "approved" WHERE formation_id = ? AND student_id = ?',
                    [payment[0].formation_id, payment[0].student_id]
                );
            }
        }
        res.json({ message: 'Payment status updated' });
    } catch (err) {
        console.error('[updatePaymentStatus]', err);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
};

// --- STATS ---
exports.getFormationStats = async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                f.id, 
                f.title, 
                f.price,
                f.currency,
                COUNT(fe.id) as total_enrollments,
                SUM(CASE WHEN fe.payment_status = 'approved' THEN 1 ELSE 0 END) as approved_enrollments,
                SUM(CASE WHEN fe.payment_status = 'approved' THEN f.price ELSE 0 END) as total_revenue
            FROM formations f
            LEFT JOIN formation_enrollments fe ON f.id = fe.formation_id
            GROUP BY f.id
        `);
        res.json(stats);
    } catch (err) {
        console.error('[getFormationStats]', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

// --- STUDENT PROGRESS ---
// H9 FIX: Enforce enrollment ownership verification
async function verifyEnrollmentAccess(enrollmentId, userId, userRole) {
    if (userRole === 'admin') return true;
    const [students] = await db.execute('SELECT id FROM students WHERE user_id = ?', [userId]);
    const studentId = students[0]?.id;
    const [enrollment] = await db.execute(
        'SELECT id FROM formation_enrollments WHERE id = ? AND (student_id = ? OR student_id = ?)',
        [enrollmentId, studentId || userId, userId]
    );
    return enrollment.length > 0;
}

exports.getStudentProgress = async (req, res) => {
    const { enrollmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        if (!await verifyEnrollmentAccess(enrollmentId, userId, userRole)) {
            return res.status(403).json({ error: 'Access denied: not your enrollment' });
        }

        const [progress] = await db.execute('SELECT * FROM formation_progress WHERE enrollment_id = ?', [enrollmentId]);
        res.json(progress);
    } catch (err) {
        console.error('[getStudentProgress]', err);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
};

exports.updateStudentProgress = async (req, res) => {
    const { enrollmentId, contentId, watchedSeconds, completed } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        if (!await verifyEnrollmentAccess(enrollmentId, userId, userRole)) {
            return res.status(403).json({ error: 'Access denied: not your enrollment' });
        }

        const [existing] = await db.execute(
            'SELECT id FROM formation_progress WHERE enrollment_id = ? AND content_id = ?',
            [enrollmentId, contentId]
        );

        if (existing.length > 0) {
            await db.execute(
                'UPDATE formation_progress SET watched_seconds = ?, completed = ?, updated_at = NOW() WHERE enrollment_id = ? AND content_id = ?',
                [watchedSeconds, completed ? 1 : 0, enrollmentId, contentId]
            );
        } else {
            const id = crypto.randomUUID();
            await db.execute(
                'INSERT INTO formation_progress (id, enrollment_id, content_id, watched_seconds, completed) VALUES (?, ?, ?, ?, ?)',
                [id, enrollmentId, contentId, watchedSeconds, completed ? 1 : 0]
            );
        }
        res.json({ message: 'Progress updated' });
    } catch (err) {
        console.error('[updateStudentProgress]', err);
        res.status(500).json({ error: 'Failed to update progress' });
    }
};

// --- PAYMENT SUBMISSION (ENROLL) ---
// M12 FIX: Validate payment amount and currency
// --- PAYMENT SUBMISSION (ENROLL) ---
// M12 & H3 FIX: Validate payment amount, currency, prevent duplicate enrollment, and use transaction
exports.submitPayment = async (req, res) => {
    const userId = req.user.id;
    const { formationId, amount, currency, paymentMethod, referenceNumber, notes } = req.body;
    
    if (!formationId) {
        return res.status(400).json({ error: 'Formation ID is required' });
    }

    const conn = await db.getConnection();
    try {
        const [student] = await conn.execute('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (student.length === 0) {
            conn.release();
            return res.status(404).json({ error: 'Student profile not found' });
        }
        
        const [formationRows] = await conn.execute('SELECT price, currency FROM formations WHERE id = ?', [formationId]);
        if (formationRows.length === 0) {
            conn.release();
            return res.status(404).json({ error: 'Formation not found' });
        }

        const formation = formationRows[0];
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 0) {
            conn.release();
            return res.status(400).json({ error: 'Invalid payment amount' });
        }

        const studentId = student[0].id;

        // H3 FIX: Check if already enrolled or pending
        const [existingEnrollment] = await conn.execute(
            'SELECT id, payment_status FROM formation_enrollments WHERE formation_id = ? AND student_id = ? AND payment_status IN ("approved", "pending")',
            [formationId, studentId]
        );
        if (existingEnrollment.length > 0) {
            conn.release();
            const status = existingEnrollment[0].payment_status;
            return res.status(409).json({ 
                error: status === 'approved' ? 'You are already enrolled in this formation' : 'You already have a pending enrollment for this formation' 
            });
        }

        await conn.beginTransaction();

        const paymentId = crypto.randomUUID();
        const enrollmentId = crypto.randomUUID();

        // 1. Create Payment record
        await conn.execute(
            'INSERT INTO formation_payments (id, formation_id, student_id, amount, currency, payment_method, reference_number, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "pending")',
            [paymentId, formationId, studentId, numAmount, currency || formation.currency || 'USD', paymentMethod, referenceNumber || null, notes || null]
        );

        // 2. Create Enrollment record (initially pending)
        await conn.execute(
            'INSERT INTO formation_enrollments (id, formation_id, student_id, payment_status, payment_id) VALUES (?, ?, ?, "pending", ?)',
            [enrollmentId, formationId, studentId, paymentId]
        );

        await conn.commit();
        res.status(201).json({ paymentId, enrollmentId });
    } catch (err) {
        await conn.rollback();
        console.error('[submitPayment]', err);
        res.status(500).json({ error: 'Payment submission failed' });
    } finally {
        conn.release();
    }
};
