const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const academicRoutes = require('./routes/academic');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const testRoutes = require('./routes/test');
const formationRoutes = require('./routes/formation');
const chatRoutes = require('./routes/chat');

dotenv.config();
const db = require('./config/db');

// Ensure otp_verifications table exists and has wide column for SHA-256 code hash
db.execute(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
        id VARCHAR(36) PRIMARY KEY,
        phone_number VARCHAR(50) NOT NULL,
        code VARCHAR(128) NOT NULL,
        attempts INT DEFAULT 0,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone (phone_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`).then(async () => {
    try {
        await db.execute('ALTER TABLE otp_verifications MODIFY COLUMN code VARCHAR(128) NOT NULL;');
    } catch (_) {}
}).catch(err => console.warn('[DB Init] OTP table check warning:', err.message));

const app = express();
const PORT = process.env.PORT || 5000;

// M4 FIX: Trust first proxy (necessary for accurate rate-limiting behind reverse proxy / load balancer)
app.set('trust proxy', 1);

// ─── Security Headers ───────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ─── CORS - Restrict to known origins ───────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8080', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            // In production, block requests without origin unless explicitly permitted
            if (process.env.NODE_ENV === 'production' && process.env.ALLOW_NO_ORIGIN !== 'true') {
                return callback(new Error('Requests with missing Origin header are not allowed by CORS'));
            }
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// ─── Body size limit ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// General limiter for all API routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

// Strict limiter for auth routes (login/register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 attempts per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' },
});

// M7 FIX: Dedicated rate limiter for OTP generation and verification (max 5 per 15 min)
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many OTP attempts, please try again in 15 minutes.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/whatsapp', otpLimiter);

// ─── Static Files (H4 FIX: Security headers to prevent MIME sniffing and script execution) ──────
app.use('/uploads', (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self'; img-src 'self'");
    next();
}, express.static(path.join(__dirname, 'uploads'), {
    dotfiles: 'ignore',
    index: false,
    maxAge: '1d'
}));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/test', testRoutes);
app.use('/api/formation', formationRoutes);
app.use('/api/chat', chatRoutes);

// ─── Root & Health (L2 FIX: Clean status without exposing server time/timestamp drift) ─────
app.get('/', (req, res) => {
    res.json({ name: 'Simply University API', status: 'running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const isDev = process.env.NODE_ENV !== 'production';
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: isDev ? err.message : 'An internal server error occurred.',
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[Simply University] Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
}

module.exports = app;
