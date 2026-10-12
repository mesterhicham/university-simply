const mysql = require('mysql2/promise');
require('dotenv').config();

// Phase 2 Security Hardening: Enforce strict environment variables in production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME', 'JWT_SECRET'];
    const missing = requiredEnv.filter(key => !process.env[key] || process.env[key].trim() === '');
    if (missing.length > 0) {
        throw new Error(`[SECURITY FATAL] Mandatory production environment variables are missing: ${missing.join(', ')}. Application startup aborted.`);
    }

    // Prohibit root/root in production
    if (process.env.DB_USER === 'root' && process.env.DB_PASS === 'root') {
        throw new Error('[SECURITY FATAL] Insecure default credentials (root/root) are prohibited in production environment.');
    }

    // Require strong JWT secret in production (minimum 32 characters)
    if (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('use_a_strong_random_string')) {
        throw new Error('[SECURITY FATAL] JWT_SECRET must be a high-entropy string of at least 32 characters in production.');
    }
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || (isProduction ? undefined : 'root'),
    password: process.env.DB_PASS !== undefined ? process.env.DB_PASS : (isProduction ? undefined : 'root'),
    database: process.env.DB_NAME || 'simplyuniversity',
    port: Number(process.env.DB_PORT) || 8889,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

module.exports = pool;
