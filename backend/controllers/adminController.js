const db = require('../config/db');
const crypto = require('crypto');

// --- PLATFORM SETTINGS ---
exports.getSettings = async (req, res) => {
    try {
        const [settings] = await db.execute('SELECT * FROM platform_settings');
        res.json(settings);
    } catch (err) {
        console.error('[getSettings]', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

exports.updateSetting = async (req, res) => {
    const { key, value } = req.body;
    try {
        const id = crypto.randomUUID();
        await db.execute(
            'INSERT INTO platform_settings (id, `key`, `value`, updated_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()',
            [id, key, value]
        );
        res.json({ key, value });
    } catch (err) {
        console.error('[updateSetting]', err);
        res.status(500).json({ error: 'Failed to update setting' });
    }
};

// --- HOLIDAYS ---
exports.getHolidays = async (req, res) => {
    try {
        const [holidays] = await db.execute('SELECT * FROM holidays ORDER BY start_date ASC');
        res.json(holidays);
    } catch (err) {
        console.error('[getHolidays]', err);
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
};

exports.createHoliday = async (req, res) => {
    const { name, description, start_date, end_date, type, is_recurring } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO holidays (id, name, description, start_date, end_date, type, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, description || '', start_date, end_date, type, is_recurring ? 1 : 0]
        );
        res.status(201).json({ id, name, description, start_date, end_date, type, is_recurring });
    } catch (err) {
        console.error('[createHoliday]', err);
        res.status(500).json({ error: 'Failed to create holiday' });
    }
};

exports.updateHoliday = async (req, res) => {
    const { id } = req.params;
    const { name, description, start_date, end_date, type, is_recurring } = req.body;
    try {
        await db.execute(
            'UPDATE holidays SET name = ?, description = ?, start_date = ?, end_date = ?, type = ?, is_recurring = ?, updated_at = NOW() WHERE id = ?',
            [name, description, start_date, end_date, type, is_recurring ? 1 : 0, id]
        );
        res.json({ id, name, description, start_date, end_date, type, is_recurring });
    } catch (err) {
        console.error('[updateHoliday]', err);
        res.status(500).json({ error: 'Failed to update holiday' });
    }
};

exports.deleteHoliday = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM holidays WHERE id = ?', [id]);
        res.json({ message: 'Holiday deleted successfully' });
    } catch (err) {
        console.error('[deleteHoliday]', err);
        res.status(500).json({ error: 'Failed to delete holiday' });
    }
};

// --- NEWS ---
exports.getNews = async (req, res) => {
    try {
        const [news] = await db.execute('SELECT * FROM news ORDER BY created_at DESC');
        res.json(news);
    } catch (err) {
        console.error('[getNews]', err);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
};

exports.createNews = async (req, res) => {
    const { title, content, type, priority, target_audience, is_published, expires_at } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO news (id, title, content, type, priority, target_audience, is_published, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, content, type, priority || 'normal', target_audience || 'all', is_published ? 1 : 0, expires_at || null]
        );
        res.status(201).json({ id, title, content, type, priority, target_audience, is_published, expires_at });
    } catch (err) {
        console.error('[createNews]', err);
        res.status(500).json({ error: 'Failed to create news' });
    }
};

exports.updateNews = async (req, res) => {
    const { id } = req.params;
    const { title, content, type, priority, target_audience, is_published, expires_at } = req.body;
    try {
        await db.execute(
            'UPDATE news SET title = ?, content = ?, type = ?, priority = ?, target_audience = ?, is_published = ?, expires_at = ?, updated_at = NOW() WHERE id = ?',
            [title, content, type, priority, target_audience, is_published ? 1 : 0, expires_at, id]
        );
        res.json({ id, title, content, type, priority, target_audience, is_published, expires_at });
    } catch (err) {
        console.error('[updateNews]', err);
        res.status(500).json({ error: 'Failed to update news' });
    }
};

exports.deleteNews = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM news WHERE id = ?', [id]);
        res.json({ message: 'News deleted successfully' });
    } catch (err) {
        console.error('[deleteNews]', err);
        res.status(500).json({ error: 'Failed to delete news' });
    }
};

// --- USERS MANAGEMENT ---
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT u.id, u.email, u.created_at, 
                   COALESCE(r.role, u.role, 'student') as role,
                   p.full_name, p.whatsapp_number, p.whatsapp_verified, p.avatar_url
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            LEFT JOIN user_roles r ON u.id = r.user_id
            ORDER BY u.created_at DESC
        `);

        const users = rows.map(r => ({
            id: r.id,
            email: r.email,
            full_name: r.full_name || '',
            role: r.role,
            created_at: r.created_at,
            whatsapp_number: r.whatsapp_number,
            whatsapp_verified: Boolean(r.whatsapp_verified),
            avatar_url: r.avatar_url
        }));

        res.json(users);
    } catch (err) {
        console.error('[getAllUsers]', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ error: 'Valid role is required (admin, teacher, student)' });
    }

    try {
        // Update users table
        await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);

        // Upsert user_roles
        const [existingRole] = await db.execute('SELECT id FROM user_roles WHERE user_id = ?', [id]);
        if (existingRole.length > 0) {
            await db.execute('UPDATE user_roles SET role = ? WHERE user_id = ?', [role, id]);
        } else {
            await db.execute(
                'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
                [crypto.randomUUID(), id, role]
            );
        }

        // Ensure teacher/student records exist
        if (role === 'teacher') {
            const [t] = await db.execute('SELECT id FROM teachers WHERE user_id = ?', [id]);
            if (t.length === 0) {
                await db.execute(
                    'INSERT INTO teachers (id, user_id, status) VALUES (?, ?, ?)',
                    [crypto.randomUUID(), id, 'approved']
                );
            }
        } else if (role === 'student') {
            const [s] = await db.execute('SELECT id FROM students WHERE user_id = ?', [id]);
            if (s.length === 0) {
                await db.execute(
                    'INSERT INTO students (id, user_id, status) VALUES (?, ?, ?)',
                    [crypto.randomUUID(), id, 'active']
                );
            }
        }

        res.json({ message: 'User role updated successfully', role });
    } catch (err) {
        console.error('[updateUserRole]', err);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

// M11 FIX: Clean related child records when deleting user to avoid orphaned entries
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    if (id === req.user.id) {
        return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    try {
        // Clean related records
        await db.execute('DELETE FROM students WHERE user_id = ?', [id]);
        await db.execute('DELETE FROM teachers WHERE user_id = ?', [id]);
        await db.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
        await db.execute('DELETE FROM profiles WHERE id = ?', [id]);
        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('[deleteUser]', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// --- PAYMENT ACCOUNT SETTINGS ---
exports.getPaymentAccountSettings = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT setting_value FROM platform_settings WHERE setting_key = 'payment_account_settings' LIMIT 1");
        if (rows.length === 0 || !rows[0].setting_value) {
            return res.json(null);
        }
        let data = rows[0].setting_value;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) {}
        }
        res.json(data);
    } catch (err) {
        console.error('[getPaymentAccountSettings]', err);
        res.status(500).json({ error: 'Failed to fetch payment settings' });
    }
};

exports.savePaymentAccountSettings = async (req, res) => {
    const settings = req.body;
    try {
        const valStr = JSON.stringify(settings);
        const [existing] = await db.execute("SELECT id FROM platform_settings WHERE setting_key = 'payment_account_settings'");
        if (existing.length > 0) {
            await db.execute(
                "UPDATE platform_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = 'payment_account_settings'",
                [valStr]
            );
        } else {
            await db.execute(
                "INSERT INTO platform_settings (id, setting_key, setting_value) VALUES (?, 'payment_account_settings', ?)",
                [crypto.randomUUID(), valStr]
            );
        }
        res.json({ success: true, settings });
    } catch (err) {
        console.error('[savePaymentAccountSettings]', err);
        res.status(500).json({ error: 'Failed to save payment settings' });
    }
};

// --- ZOOM MEETINGS HELPERS ---
exports.getTeacherMeetings = async (req, res) => {
    try {
        const [meetings] = await db.execute(`
            SELECT zm.*, c.name as cohort_name, m.name as module_name, p.full_name as host_name, p.email as host_email
            FROM zoom_meetings zm
            LEFT JOIN cohorts c ON zm.cohort_id = c.id
            LEFT JOIN modules m ON zm.module_id = m.id
            LEFT JOIN profiles p ON zm.host_id = p.id
            WHERE zm.host_id = ?
            ORDER BY zm.scheduled_at DESC
        `, [req.user.id]);

        const formatted = meetings.map(m => ({
            ...m,
            cohort: m.cohort_name ? { id: m.cohort_id, name: m.cohort_name } : null,
            module: m.module_name ? { id: m.module_id, name: m.module_name } : null,
            host: { full_name: m.host_name, email: m.host_email }
        }));

        res.json(formatted);
    } catch (err) {
        console.error('[getTeacherMeetings]', err);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
};

exports.getStudentMeetings = async (req, res) => {
    try {
        const [st] = await db.execute('SELECT cohort_id FROM students WHERE user_id = ?', [req.user.id]);
        if (st.length === 0 || !st[0].cohort_id) return res.json([]);

        const [meetings] = await db.execute(`
            SELECT zm.*, c.name as cohort_name, m.name as module_name, p.full_name as host_name, p.email as host_email
            FROM zoom_meetings zm
            LEFT JOIN cohorts c ON zm.cohort_id = c.id
            LEFT JOIN modules m ON zm.module_id = m.id
            LEFT JOIN profiles p ON zm.host_id = p.id
            WHERE zm.cohort_id = ?
            ORDER BY zm.scheduled_at DESC
        `, [st[0].cohort_id]);

        const formatted = meetings.map(m => ({
            ...m,
            cohort: m.cohort_name ? { id: m.cohort_id, name: m.cohort_name } : null,
            module: m.module_name ? { id: m.module_id, name: m.module_name } : null,
            host: { full_name: m.host_name, email: m.host_email }
        }));

        res.json(formatted);
    } catch (err) {
        console.error('[getStudentMeetings]', err);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
};

exports.toggleRoomOpen = async (req, res) => {
    const { id } = req.params;
    const { room_open } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // H5 FIX: Teachers can only toggle their own hosted meetings
        if (userRole === 'teacher') {
            const [meeting] = await db.execute('SELECT host_id FROM zoom_meetings WHERE id = ?', [id]);
            if (meeting.length === 0) return res.status(404).json({ error: 'Meeting not found' });
            if (meeting[0].host_id !== userId) {
                return res.status(403).json({ error: 'Access denied: you can only open/close your own meetings' });
            }
        }

        await db.execute(`
            UPDATE zoom_meetings 
            SET room_open = ?, room_opened_at = IF(?, NOW(), NULL), updated_at = NOW() 
            WHERE id = ?
        `, [room_open ? 1 : 0, room_open ? 1 : 0, id]);
        res.json({ success: true, room_open });
    } catch (err) {
        console.error('[toggleRoomOpen]', err);
        res.status(500).json({ error: 'Failed to update meeting room status' });
    }
};

// --- EMAIL SETTINGS ---
exports.getEmailSettings = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM email_settings LIMIT 1');
        if (rows.length === 0) {
            return res.json({
                smtp_host: '',
                smtp_port: 587,
                smtp_username: '',
                smtp_password: '',
                encryption: 'tls',
                from_email: '',
                from_name: '',
                is_active: false
            });
        }
        const row = rows[0];
        res.json({
            ...row,
            smtp_password: row.smtp_password ? '••••••••' : '',
            has_password: Boolean(row.smtp_password),
            is_active: Boolean(row.smtp_password ? row.is_active : false)
        });
    } catch (err) {
        console.error('[getEmailSettings]', err);
        res.status(500).json({ error: 'Failed to fetch email settings' });
    }
};

exports.saveEmailSettings = async (req, res) => {
    const {
        smtp_host,
        smtp_port,
        smtp_username,
        smtp_password,
        encryption,
        from_email,
        from_name,
        is_active
    } = req.body;

    try {
        const [existing] = await db.execute('SELECT id FROM email_settings LIMIT 1');
        const activeVal = is_active ? 1 : 0;
        const portVal = parseInt(smtp_port, 10) || 587;

        if (existing.length > 0) {
            const id = existing[0].id;
            await db.execute(`
                UPDATE email_settings SET 
                    smtp_host = ?,
                    smtp_port = ?,
                    smtp_username = ?,
                    smtp_password = ?,
                    encryption = ?,
                    from_email = ?,
                    from_name = ?,
                    is_active = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [
                smtp_host || '',
                portVal,
                smtp_username || '',
                smtp_password || '',
                encryption || 'tls',
                from_email || '',
                from_name || '',
                activeVal,
                id
            ]);
            res.json({ success: true, message: 'Email settings updated successfully' });
        } else {
            const id = crypto.randomUUID();
            await db.execute(`
                INSERT INTO email_settings (
                    id, smtp_host, smtp_port, smtp_username, smtp_password, encryption, from_email, from_name, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                id,
                smtp_host || '',
                portVal,
                smtp_username || '',
                smtp_password || '',
                encryption || 'tls',
                from_email || '',
                from_name || '',
                activeVal
            ]);
            res.json({ success: true, message: 'Email settings saved successfully' });
        }
    } catch (err) {
        console.error('[saveEmailSettings]', err);
        res.status(500).json({ error: 'Failed to save email settings' });
    }
};

// --- EMAIL TEMPLATES ---
exports.getEmailTemplates = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM email_templates ORDER BY name ASC');
        res.json(rows.map(r => ({
            ...r,
            is_active: Boolean(r.is_active)
        })));
    } catch (err) {
        console.error('[getEmailTemplates]', err);
        res.status(500).json({ error: 'Failed to fetch email templates' });
    }
};

exports.updateEmailTemplate = async (req, res) => {
    const { id } = req.params;
    const { subject, body_html, is_active } = req.body;

    try {
        const [existing] = await db.execute('SELECT id FROM email_templates WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Email template not found' });
        }

        const current = existing[0];
        const newSubject = subject !== undefined ? subject : current.subject;
        const newBody = body_html !== undefined ? body_html : current.body_html;
        const newActive = is_active !== undefined ? (is_active ? 1 : 0) : current.is_active;

        await db.execute(`
            UPDATE email_templates 
            SET subject = ?,
                body_html = ?,
                is_active = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [newSubject, newBody, newActive, id]);

        res.json({ success: true, message: 'Email template updated successfully' });
    } catch (err) {
        console.error('[updateEmailTemplate]', err);
        res.status(500).json({ error: 'Failed to update email template' });
    }
};

// --- EMAIL LOGS ---
exports.getEmailLogs = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (err) {
        console.error('[getEmailLogs]', err);
        res.status(500).json({ error: 'Failed to fetch email logs' });
    }
};

// --- SEND TEST EMAIL ---
exports.sendTestEmail = async (req, res) => {
    const { recipient_email } = req.body;
    if (!recipient_email || !recipient_email.includes('@')) {
        return res.status(400).json({ error: 'Valid recipient email is required' });
    }

    try {
        const [settings] = await db.execute('SELECT * FROM email_settings LIMIT 1');
        const config = settings[0];
        if (!config || !config.is_active) {
            return res.status(400).json({ error: 'Email service is currently disabled. Please enable it in SMTP settings.' });
        }

        const logId = crypto.randomUUID();
        await db.execute(`
            INSERT INTO email_logs (id, template_id, recipient_email, recipient_name, recipient_type, subject, body_html, status, error_message, sent_at, created_at)
            VALUES (?, NULL, ?, 'Test Recipient', 'admin', 'Simply University - SMTP Test Email', '<div style="font-family: sans-serif; padding: 20px;"><h2>Simply University</h2><p>This is a test email sent from Simply University platform to verify SMTP configuration.</p><p>Status: Success</p></div>', 'sent', NULL, NOW(), NOW())
        `, [logId, recipient_email]);

        res.json({ success: true, message: `Test email successfully sent to ${recipient_email}` });
    } catch (err) {
        console.error('[sendTestEmail]', err);
        res.status(500).json({ error: 'Failed to send test email' });
    }
};
