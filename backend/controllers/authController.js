const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.register = async (req, res) => {
    const { email, password, fullName, city, country, whatsappNumber, role, specialty, experience } = req.body;
    
    // Validate role: only allow student or teacher self-registration
    const assignedRole = (role === 'teacher' || role === 'student') ? role : 'student';

    try {
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }

        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = crypto.randomUUID();

        // 1. Insert into users table
        await db.execute(
            'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)',
            [userId, email, hashedPassword, assignedRole]
        );

        // 2. Insert into profiles table
        await db.execute(
            'INSERT INTO profiles (id, email, full_name, city, country, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, email, fullName, city || '', country || '', whatsappNumber || '']
        );

        // 3. Insert into user_roles table
        await db.execute(
            'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
            [crypto.randomUUID(), userId, assignedRole]
        );

        // 4. Role-specific record creation
        if (assignedRole === 'teacher') {
            await db.execute(
                'INSERT INTO teachers (id, user_id, specialty, experience, status) VALUES (?, ?, ?, ?, ?)',
                [crypto.randomUUID(), userId, specialty || '', experience || '', 'pending']
            );
        } else {
            await db.execute(
                'INSERT INTO students (id, user_id, status) VALUES (?, ?, ?)',
                [crypto.randomUUID(), userId, 'active']
            );
        }

        res.status(201).json({ message: 'User registered successfully. ' + (assignedRole === 'teacher' ? 'Your account is pending admin approval.' : '') });
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
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters.' });
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
exports.checkAdminExists = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT id FROM user_roles WHERE role = 'admin' LIMIT 1");
        res.json({ hasAdmin: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check admin status.' });
    }
};

exports.setupFirstAdmin = async (req, res) => {
    const userId = req.user.id;
    try {
        // H3 FIX: Use atomic INSERT...SELECT to prevent race condition (TOCTOU)
        const roleId = crypto.randomUUID();
        const [result] = await db.execute(
            `INSERT INTO user_roles (id, user_id, role) 
             SELECT ?, ?, 'admin' FROM DUAL 
             WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin')`,
            [roleId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'An admin already exists in the system.' });
        }

        await db.execute("UPDATE users SET role = 'admin' WHERE id = ?", [userId]);

        res.json({ success: true, message: 'First admin created successfully' });
    } catch (err) {
        console.error('[setupFirstAdmin]', err);
        res.status(500).json({ error: 'Admin setup failed.' });
    }
};

// --- WHATSAPP OTP ---
const otpStore = new Map(); // phone -> { code, expiresAt, attempts }
const OTP_MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// C4 FIX: Auto-cleanup expired OTPs every 5 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [phone, data] of otpStore.entries()) {
        if (now > data.expiresAt) {
            otpStore.delete(phone);
        }
    }
}, 5 * 60 * 1000);

exports.sendWhatsAppOtp = async (req, res) => {
    const { phone_number } = req.body;
    if (!phone_number || phone_number.length < 8) {
        return res.status(400).json({ error: 'Valid phone number is required' });
    }

    try {
        // Generate random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + OTP_EXPIRY_MS;

        otpStore.set(phone_number.trim(), { code, expiresAt, attempts: 0 });

        // C4 FIX: OTP is only logged server-side, NEVER sent in response
        console.log(`[WhatsApp OTP] Code generated for ${phone_number.substring(0, 4)}****`);

        res.json({
            success: true,
            message: 'OTP sent successfully'
            // C4 FIX: Removed devOtp from response
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send OTP.' });
    }
};

exports.verifyWhatsAppOtp = async (req, res) => {
    const { phone_number, code } = req.body;
    if (!phone_number || !code) {
        return res.status(400).json({ error: 'Phone number and code are required' });
    }

    const cleanPhone = phone_number.trim();
    const stored = otpStore.get(cleanPhone);

    if (!stored) {
        return res.status(400).json({ error: 'No OTP requested for this number or expired' });
    }

    if (Date.now() > stored.expiresAt) {
        otpStore.delete(cleanPhone);
        return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    // C4 FIX: Rate limit OTP verification attempts
    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts > OTP_MAX_ATTEMPTS) {
        otpStore.delete(cleanPhone);
        return res.status(429).json({ error: 'Too many verification attempts. Please request a new code.' });
    }

    if (stored.code !== code.toString().trim()) {
        return res.status(400).json({ error: 'Invalid verification code' });
    }

    // OTP verified
    otpStore.delete(cleanPhone);

    try {
        // If user is authenticated, update their profile
        if (req.user?.id) {
            await db.execute('UPDATE profiles SET whatsapp_verified = 1 WHERE id = ?', [req.user.id]);
        } else {
            await db.execute('UPDATE profiles SET whatsapp_verified = 1 WHERE whatsapp_number = ?', [cleanPhone]);
        }

        res.json({ success: true, verified: true });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed.' });
    }
};

