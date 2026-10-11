const db = require('../config/db');
const crypto = require('crypto');

// --- PROGRAM PRICING ---
exports.getProgramPricing = async (req, res) => {
    try {
        const [pricing] = await db.execute(`
            SELECT pp.*, p.name as program_name, p.duration, p.description 
            FROM program_pricing pp
            JOIN programs p ON pp.program_id = p.id
        `);
        res.json(pricing);
    } catch (err) {
        console.error('[getProgramPricing]', err);
        res.status(500).json({ error: 'Failed to fetch program pricing' });
    }
};

exports.upsertPricing = async (req, res) => {
    const { program_id, price, currency, is_active } = req.body;
    try {
        const numPrice = parseFloat(price);
        // M3 FIX: Ensure program price is strictly positive
        if (isNaN(numPrice) || numPrice <= 0) {
            return res.status(400).json({ error: 'Price must be a positive number greater than zero' });
        }
        if (!program_id) {
            return res.status(400).json({ error: 'Valid program_id is required' });
        }

        await db.execute(
            `INSERT INTO program_pricing (id, program_id, price, currency, is_active, updated_at) 
             VALUES (?, ?, ?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE price = VALUES(price), currency = VALUES(currency), is_active = VALUES(is_active), updated_at = NOW()`,
            [crypto.randomUUID(), program_id, numPrice, currency || 'USD', is_active ? 1 : 0]
        );
        res.json({ program_id, price: numPrice, currency: currency || 'USD', is_active });
    } catch (err) {
        console.error('[upsertPricing]', err);
        res.status(500).json({ error: 'Failed to update pricing' });
    }
};

// --- PAYMENTS ---
exports.getStudentPayments = async (req, res) => {
    try {
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ? OR id = ?', [req.user.id, req.user.id]);
        if (student.length === 0) return res.json([]);

        const [payments] = await db.execute(`
            SELECT py.*, p.name as program_name 
            FROM payments py
            LEFT JOIN programs p ON py.program_id = p.id
            WHERE py.student_id = ?
            ORDER BY py.created_at DESC
        `, [student[0].id]);
        res.json(payments);
    } catch (err) {
        console.error('[getStudentPayments error]', err);
        res.status(500).json({ error: 'Failed to fetch student payments' });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const [payments] = await db.execute(`
            SELECT 
                py.*, 
                p.name as program_name, 
                COALESCE(pr.full_name, u.email, 'Student') as full_name, 
                COALESCE(pr.email, u.email) as email 
            FROM payments py
            LEFT JOIN programs p ON py.program_id = p.id
            LEFT JOIN students s ON py.student_id = s.id
            LEFT JOIN profiles pr ON s.user_id = pr.id
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY py.created_at DESC
        `);
        res.json(payments);
    } catch (err) {
        console.error('[getAllPayments error]', err);
        res.status(500).json({ error: 'Failed to fetch all payments' });
    }
};

// C4 & H1 FIX: Require valid programId, verify amount against real pricing, remove arbitrary fallback
exports.submitPayment = async (req, res) => {
    const { programId, amount, referenceNumber, notes, receiptUrl } = req.body;
    
    // M12 FIX: Validate amount is a positive number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    if (!programId) {
        return res.status(400).json({ error: 'A valid programId is required to submit a payment' });
    }

    const conn = await db.getConnection();
    try {
        // C4 FIX: Verify program exists
        const [progRows] = await conn.execute('SELECT id, name FROM programs WHERE id = ?', [programId]);
        if (progRows.length === 0) {
            conn.release();
            return res.status(400).json({ error: 'Selected program does not exist' });
        }
        const validProgramId = progRows[0].id;

        // H1 FIX: Verify real program price from program_pricing
        const [pricingRows] = await conn.execute('SELECT price, currency FROM program_pricing WHERE program_id = ? AND is_active = 1', [validProgramId]);
        if (pricingRows.length > 0) {
            const officialPrice = parseFloat(pricingRows[0].price);
            if (!isNaN(officialPrice) && officialPrice > 0 && numAmount < officialPrice) {
                conn.release();
                return res.status(400).json({ error: `Payment amount (${numAmount}) cannot be less than program price (${officialPrice})` });
            }
        }

        await conn.beginTransaction();

        const [student] = await conn.execute('SELECT id FROM students WHERE user_id = ? OR id = ?', [req.user.id, req.user.id]);
        let studentId;
        if (student.length === 0) {
            studentId = crypto.randomUUID();
            await conn.execute(
                'INSERT INTO students (id, user_id, status, enrollment_date) VALUES (?, ?, ?, NOW())',
                [studentId, req.user.id, 'active']
            );
        } else {
            studentId = student[0].id;
        }

        // Sanitize receipt_url
        let safeReceiptUrl = '';
        if (receiptUrl && typeof receiptUrl === 'string') {
            if (receiptUrl.startsWith('http://') || receiptUrl.startsWith('https://') || receiptUrl.startsWith('/uploads/')) {
                safeReceiptUrl = receiptUrl;
            }
        }

        const id = crypto.randomUUID();
        await conn.execute(
            'INSERT INTO payments (id, student_id, program_id, amount, payment_method, reference_number, notes, receipt_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, studentId, validProgramId, numAmount, 'manual', referenceNumber || '', notes || '', safeReceiptUrl, 'pending']
        );

        await conn.commit();
        res.status(201).json({ id, status: 'pending' });
    } catch (err) {
        await conn.rollback();
        console.error('[submitPayment error]', err);
        res.status(500).json({ error: 'Failed to submit payment' });
    } finally {
        conn.release();
    }
};

exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    try {
        const allowedStatuses = ['pending', 'approved', 'rejected'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await db.execute(
            'UPDATE payments SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() WHERE id = ?',
            [status, adminNotes || '', req.user.id, id]
        );
        res.json({ id, status });
    } catch (err) {
        console.error('[updatePaymentStatus error]', err);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
};
