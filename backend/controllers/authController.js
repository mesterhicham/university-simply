const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const whatsappService = require('../services/whatsappService');

// C9 & M1 FIX: Transactional registration and strong password enforcement
exports.register = async (req, res) => {
    const { email, password, fullName, city, country, whatsappNumber, role, specialty, experience } = req.body;
    
    // Validate role: only allow student or teacher self-registration
    const assignedRole = (role === 'teacher' || role === 'student') ? role : 'student';

    try {
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required.' });
        }
        // M1 FIX: Strong password requirements (min 8 chars, letter + number)
        if (password.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include at least one letter and one number.' });
        }

        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = crypto.randomUUID();

        // C9 FIX: Database transaction ensures complete atomic creation of all related records
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Insert into users table
            await conn.execute(
                'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)',
                [userId, email, hashedPassword, assignedRole]
            );

            // 2. Insert into profiles table
            await conn.execute(
                'INSERT INTO profiles (id, email, full_name, city, country, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, email, fullName, city || '', country || '', whatsappNumber || '']
            );

            // 3. Insert into user_roles table
            await conn.execute(
                'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
                [crypto.randomUUID(), userId, assignedRole]
            );

            // 4. Role-specific record creation
            if (assignedRole === 'teacher') {
                await conn.execute(
                    'INSERT INTO teachers (id, user_id, specialty, experience, status) VALUES (?, ?, ?, ?, ?)',
                    [crypto.randomUUID(), userId, specialty || '', experience || '', 'pending']
                );
            } else {
                await conn.execute(
                    'INSERT INTO students (id, user_id, status) VALUES (?, ?, ?)',
                    [crypto.randomUUID(), userId, 'active']
                );
            }

            await conn.commit();
            res.status(201).json({ message: 'User registered successfully. ' + (assignedRole === 'teacher' ? 'Your account is pending admin approval.' : '') });
        } catch (txErr) {
            await conn.rollback();
            throw txErr;
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('[register]', err);
        res.status(500).json({ error: 'Registration failed.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        // H1 FIX: Check account status - block suspended/deactivated users
        if (user.role === 'teacher') {
            const [teacherRows] = await db.execute('SELECT status FROM teachers WHERE user_id = ?', [user.id]);
            if (teacherRows.length > 0 && teacherRows[0].status === 'pending') {
                return res.status(403).json({ error: 'Your account is pending admin approval.' });
            }
            if (teacherRows.length > 0 && teacherRows[0].status === 'suspended') {
                return res.status(403).json({ error: 'Your account has been suspended. Contact admin.' });
            }
        }
        if (user.role === 'student') {
            const [studentRows] = await db.execute('SELECT status FROM students WHERE user_id = ?', [user.id]);
            if (studentRows.length > 0 && studentRows[0].status === 'suspended') {
                return res.status(403).json({ error: 'Your account has been suspended. Contact admin.' });
            }
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('[login]', err);
        res.status(500).json({ error: 'Login failed.' });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        // H8 FIX: Validate new password quality
        if (!newPassword || newPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
            return res.status(400).json({ error: 'New password must be at least 8 characters and include at least one letter and one number.' });
        }

        const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Current password incorrect' });

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Password change failed.' });
    }
};

// --- ADMIN SETUP (First Admin) ---
// C1 FIX: Check both user_roles and users table, and optionally require ADMIN_SETUP_SECRET
exports.checkAdminExists = async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT id FROM users WHERE role = 'admin' UNION SELECT user_id as id FROM user_roles WHERE role = 'admin' LIMIT 1"
        );
        res.json({ hasAdmin: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check admin status.' });
    }
};

exports.setupFirstAdmin = async (req, res) => {
    const userId = req.user.id;
    const setupSecret = req.body?.setupSecret || req.headers['x-admin-setup-secret'];

    // Enforce ADMIN_SETUP_SECRET: mandatory in production, checked if set in non-production
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.ADMIN_SETUP_SECRET || setupSecret !== process.env.ADMIN_SETUP_SECRET) {
            return res.status(403).json({ error: 'Admin setup secret is mandatory in production and was invalid or missing.' });
        }
    } else if (process.env.ADMIN_SETUP_SECRET && setupSecret !== process.env.ADMIN_SETUP_SECRET) {
        return res.status(403).json({ error: 'Valid admin setup secret token is required.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Check if ANY admin already exists in users or user_roles with lock
        const [existing] = await conn.execute(
            "SELECT id FROM users WHERE role = 'admin' UNION SELECT user_id as id FROM user_roles WHERE role = 'admin' LIMIT 1 FOR UPDATE"
        );

        if (existing.length > 0) {
            await conn.rollback();
            return res.status(403).json({ error: 'Admin setup is permanently disabled: an administrator already exists in the system.' });
        }

        // Atomically grant admin role across user_roles and users tables in single transaction
        const roleId = crypto.randomUUID();
        await conn.execute(
            "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')",
            [roleId, userId]
        );
        await conn.execute("UPDATE users SET role = 'admin' WHERE id = ?", [userId]);

        await conn.commit();
        res.json({ success: true, message: 'First admin created successfully' });
    } catch (err) {
        await conn.rollback();
        console.error('[setupFirstAdmin]', err);
        res.status(500).json({ error: 'Admin setup failed.' });
    } finally {
        conn.release();
    }
};

// --- WHATSAPP OTP ---
// Phase 4 FIX: Secure SHA-256 hashed storage, 5-minute expiry, max 3 attempts, cooldown check, and provider integration
const OTP_MAX_ATTEMPTS = 3;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_COOLDOWN_MS = 60 * 1000;   // 60-second cooldown between requests

function hashOtpCode(code) {
    const salt = process.env.JWT_SECRET || 'university-otp-salt-2026';
    return crypto.createHash('sha256').update(String(code).trim() + salt).digest('hex');
}

// Periodic cleanup of expired OTPs from database
setInterval(async () => {
    try {
        await db.execute('DELETE FROM otp_verifications WHERE expires_at < ?', [Date.now()]);
    } catch (err) {
        // Ignore background cleanup errors
    }
}, 5 * 60 * 1000);

exports.sendWhatsAppOtp = async (req, res) => {
    const { phone_number, purpose } = req.body;
    if (!phone_number || typeof phone_number !== 'string' || phone_number.trim().length < 8) {
        return res.status(400).json({ error: 'Valid phone number is required (min 8 digits)' });
    }

    const cleanPhone = phone_number.trim().replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 8) {
        return res.status(400).json({ error: 'Valid phone number is required' });
    }

    try {
        // Cooldown check: reject if OTP was generated within the last 60 seconds
        const [existing] = await db.execute(
            'SELECT created_at, expires_at FROM otp_verifications WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1',
            [cleanPhone]
        );

        if (existing.length > 0) {
            const timeSinceLast = Date.now() - new Date(existing[0].created_at).getTime();
            if (timeSinceLast < OTP_COOLDOWN_MS) {
                const waitSec = Math.ceil((OTP_COOLDOWN_MS - timeSinceLast) / 1000);
                return res.status(429).json({ error: `Please wait ${waitSec} seconds before requesting a new code.` });
            }
        }

        // Cryptographically secure random 6-digit code (CSPRNG)
        const code = crypto.randomInt(100000, 1000000).toString();
        const codeHash = hashOtpCode(code);
        const expiresAt = Date.now() + OTP_EXPIRY_MS;
        const recordId = crypto.randomUUID();
        const otpPurpose = (purpose && typeof purpose === 'string') ? purpose.trim() : 'phone_verification';

        // Dispatch via WhatsApp messaging provider
        const sendResult = await whatsappService.sendOtp(
            cleanPhone,
            `Your Simply University verification code is: ${code}. This code expires in 5 minutes.`
        );

        if (!sendResult.success) {
            return res.status(503).json({ error: sendResult.error || 'Failed to dispatch WhatsApp OTP' });
        }

        // Store secure hash only (never plaintext code)
        await db.execute('DELETE FROM otp_verifications WHERE phone_number = ?', [cleanPhone]);
        await db.execute(
            'INSERT INTO otp_verifications (id, phone_number, code, attempts, expires_at) VALUES (?, ?, ?, 0, ?)',
            [recordId, cleanPhone, codeHash, expiresAt]
        );

        res.json({
            success: true,
            message: sendResult.simulated ? 'OTP generated in simulation mode' : 'OTP dispatched successfully via WhatsApp',
            expires_in: 300,
            simulated: Boolean(sendResult.simulated)
        });
    } catch (err) {
        console.error('[sendWhatsAppOtp]', err);
        res.status(500).json({ error: 'Failed to process WhatsApp OTP request.' });
    }
};

exports.verifyWhatsAppOtp = async (req, res) => {
    const { phone_number, code } = req.body;
    if (!phone_number || !code) {
        return res.status(400).json({ error: 'Phone number and code are required' });
    }

    const cleanPhone = phone_number.trim().replace(/[^0-9+]/g, '');
    const cleanCode = code.toString().trim();

    try {
        const [rows] = await db.execute(
            'SELECT * FROM otp_verifications WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1',
            [cleanPhone]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'No OTP requested for this number or code expired.' });
        }

        const stored = rows[0];

        if (Date.now() > Number(stored.expires_at)) {
            await db.execute('DELETE FROM otp_verifications WHERE phone_number = ?', [cleanPhone]);
            return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
        }

        const currentAttempts = (stored.attempts || 0) + 1;
        if (currentAttempts > OTP_MAX_ATTEMPTS) {
            await db.execute('DELETE FROM otp_verifications WHERE phone_number = ?', [cleanPhone]);
            return res.status(429).json({ error: 'Maximum verification attempts exceeded. Please request a new code.' });
        }

        // Verify hash
        const candidateHash = hashOtpCode(cleanCode);
        const isMatch = (stored.code === candidateHash) || (stored.code === cleanCode);

        if (!isMatch) {
            await db.execute('UPDATE otp_verifications SET attempts = ? WHERE id = ?', [currentAttempts, stored.id]);
            return res.status(400).json({
                error: 'Invalid verification code',
                remaining_attempts: Math.max(0, OTP_MAX_ATTEMPTS - currentAttempts)
            });
        }

        // OTP verified successfully - immediately delete OTP record to prevent replay attacks
        await db.execute('DELETE FROM otp_verifications WHERE phone_number = ?', [cleanPhone]);

        // If user is authenticated, update their profile
        if (req.user?.id) {
            await db.execute('UPDATE profiles SET whatsapp_verified = 1 WHERE id = ?', [req.user.id]);
        } else {
            await db.execute('UPDATE profiles SET whatsapp_verified = 1 WHERE whatsapp_number = ?', [cleanPhone]);
        }

        res.json({ success: true, verified: true });
    } catch (err) {
        console.error('[verifyWhatsAppOtp]', err);
        res.status(500).json({ error: 'Verification failed.' });
    }
};


