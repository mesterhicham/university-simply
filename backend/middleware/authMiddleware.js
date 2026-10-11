const jwt = require('jsonwebtoken');
const db = require('../config/db');

const auth = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

        // H6 FIX: Verify user still exists in DB and get their authoritative current role
        const [users] = await db.execute('SELECT id, role FROM users WHERE id = ?', [decoded.id]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'User no longer exists or session revoked' });
        }

        const user = users[0];
        req.user = {
            ...decoded,
            id: user.id,
            role: user.role
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token is not valid' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: insufficient permissions' });
        }
        next();
    };
};

module.exports = { auth, authorize };
