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

        // Check user-level suspension if column exists
        if (user.status && user.status === 'suspended') {
            return res.status(403).json({ error: 'Account suspended. Access denied.' });
        }

        // Check role-specific suspension status
        if (user.role === 'teacher') {
            const [teacherRows] = await db.execute('SELECT status FROM teachers WHERE user_id = ?', [user.id]);
            if (teacherRows.length > 0) {
                if (teacherRows[0].status === 'suspended') {
                    return res.status(403).json({ error: 'Teacher account is suspended. Access denied.' });
                }
                if (teacherRows[0].status === 'pending') {
                    return res.status(403).json({ error: 'Teacher account is pending approval. Access denied.' });
                }
            }
        } else if (user.role === 'student') {
            const [studentRows] = await db.execute('SELECT status FROM students WHERE user_id = ?', [user.id]);
            if (studentRows.length > 0 && studentRows[0].status === 'suspended') {
                return res.status(403).json({ error: 'Student account is suspended. Access denied.' });
            }
        }

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
