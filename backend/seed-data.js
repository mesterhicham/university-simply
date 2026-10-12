const bcrypt = require('bcryptjs');
const pool = require('./config/db');
const crypto = require('crypto');
require('dotenv').config();

// Phase 7 FIX: Production Barrier
if (process.env.NODE_ENV === 'production') {
    console.error('[SECURITY ERROR] Seeding script is strictly prohibited in production environments.');
    process.exit(1);
}

// Barrier to prevent running on production database names
const dbName = (process.env.DB_NAME || '').toLowerCase();
if (dbName.includes('prod') || dbName.includes('live')) {
    console.error(`[SECURITY ERROR] Target database "${dbName}" appears to be a production database. Seeding aborted.`);
    process.exit(1);
}

async function seed() {
    try {
        console.log('Seeding initial development/test data safely...');

        // 1. Check if any admin already exists before creating
        const [existingAdmins] = await pool.query(
            "SELECT id, email FROM users WHERE role = 'admin' UNION SELECT user_id as id, 'admin' as email FROM user_roles WHERE role = 'admin' LIMIT 1"
        );

        if (existingAdmins.length > 0) {
            console.log('[Seed] An administrator already exists in the system. Preserving existing admin.');
        } else {
            const adminId = crypto.randomUUID();
            const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@academy.local';
            const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin123!';
            const hashedPassword = await bcrypt.hash(adminPassword, 12);

            await pool.query(
                'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)',
                [adminId, adminEmail, hashedPassword, 'admin']
            );

            await pool.query(
                'INSERT INTO profiles (id, email, full_name) VALUES (?, ?, ?)',
                [adminId, adminEmail, 'System Administrator']
            );

            await pool.query(
                'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
                [crypto.randomUUID(), adminId, 'admin']
            );

            console.log(`[Seed] Initial administrator created: ${adminEmail}`);
        }

        // 2. Default Platform Settings (Safe INSERT IGNORE)
        const settings = [
            ['platform_name', 'Simply University', 'text', 'branding'],
            ['logo_url', '', 'image', 'branding'],
            ['primary_color', '222 47% 11%', 'color', 'theme'],
            ['accent_color', '262 83% 58%', 'color', 'theme'],
            ['welcome_message', 'Welcome to Simply University learning platform', 'text', 'ui_texts'],
            ['footer_text', 'All rights reserved - Simply University', 'text', 'ui_texts']
        ];

        for (const [key, value, type, category] of settings) {
            await pool.query(
                'INSERT INTO platform_settings (id, `key`, `value`, `type`, category) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `key` = `key`',
                [crypto.randomUUID(), key, value, type, category]
            );
        }

        // 3. Default Email Templates (Safe INSERT IGNORE)
        const templates = [
            ['Welcome Email', 'welcome', 'Welcome to {{platform_name}}!', '<h1>Welcome {{user_name}}!</h1>', '["user_name", "platform_name"]'],
            ['Password Reset', 'password-reset', 'Reset Your Password', '<h1>Password Reset</h1>', '["user_name", "reset_link"]']
        ];

        for (const [name, slug, subject, body, vars] of templates) {
            await pool.query(
                'INSERT INTO email_templates (id, name, slug, subject, body_html, variables) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `slug` = `slug`',
                [crypto.randomUUID(), name, slug, subject, body, vars]
            );
        }

        console.log('[Seed] Seeding completed safely without touching existing user credentials.');
        process.exit(0);
    } catch (err) {
        console.error('[Seed Error]:', err.message);
        process.exit(1);
    }
}

seed();
