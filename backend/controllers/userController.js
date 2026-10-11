const db = require('../config/db');
const bcrypt = require('bcryptjs');

// --- COMMON ---
exports.getProfile = async (req, res) => {
    try {
        const [profiles] = await db.execute(`
            SELECT p.*, u.email, u.role 
            FROM profiles p 
            JOIN users u ON p.id = u.id 
            WHERE p.id = ?
        `, [req.user.id]);
        if (profiles.length === 0) return res.status(404).json({ error: 'Profile not found' });
        res.json(profiles[0]);
    } catch (err) {
        console.error('[getProfile]', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

exports.updateProfile = async (req, res) => {
    const { full_name, phone, address, city, country, bio, date_of_birth, avatar_url } = req.body;
    try {
        await db.execute(
            `UPDATE profiles SET 
                full_name = ?, phone = ?, address = ?, city = ?, country = ?, 
                bio = ?, date_of_birth = ?, avatar_url = ?, updated_at = NOW() 
             WHERE id = ?`,
            [
                full_name ?? null,
                phone ?? null,
                address ?? null,
                city ?? null,
                country ?? null,
                bio ?? null,
                date_of_birth ?? null,
                avatar_url ?? null,
                req.user.id
            ]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('[updateProfile]', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

exports.deleteAccount = async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
        return res.status(400).json({ error: 'Password confirmation is required to delete your account' });
    }

    try {
        const [users] = await db.execute('SELECT password, role FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Prevent deleting the sole admin
        if (user.role === 'admin') {
            const [adminCount] = await db.execute("SELECT COUNT(*) as count FROM user_roles WHERE role = 'admin'");
            if (adminCount[0].count <= 1) {
                return res.status(400).json({ error: 'Cannot delete the sole administrator account' });
            }
        }

        // Clean up role-specific tables
        await db.execute('DELETE FROM students WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM teachers WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM profiles WHERE id = ?', [userId]);
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('[deleteAccount]', err);
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

// --- ADMIN DASHBOARD ---
exports.getAdminStats = async (req, res) => {
    try {
        const [studentsCount] = await db.execute('SELECT COUNT(*) as count FROM students');
        const [activeStudentsCount] = await db.execute("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
        const [graduatedStudentsCount] = await db.execute("SELECT COUNT(*) as count FROM students WHERE status = 'graduated'");
        const [teachersCount] = await db.execute('SELECT COUNT(*) as count FROM teachers');
        const [pendingTeachersCount] = await db.execute("SELECT COUNT(*) as count FROM teachers WHERE status = 'pending'");
        const [programsCount] = await db.execute('SELECT COUNT(*) as count FROM programs');
        const [cohortsCount] = await db.execute('SELECT COUNT(*) as count FROM cohorts');
        const [modulesCount] = await db.execute('SELECT COUNT(*) as count FROM modules');
        const [formationsCount] = await db.execute('SELECT COUNT(*) as count FROM formations');
        const [pendingPayments] = await db.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'pending'");
        const [revenue] = await db.execute("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'approved'");

        // Program distribution
        const [programDist] = await db.execute(`
            SELECT p.name, COUNT(s.id) as students
            FROM programs p
            LEFT JOIN specialties sp ON sp.program_id = p.id
            LEFT JOIN cohorts c ON c.specialty_id = sp.id
            LEFT JOIN students s ON s.cohort_id = c.id
            GROUP BY p.id, p.name
            ORDER BY students DESC
            LIMIT 5
        `);

        // Monthly enrollments (last 6 months)
        const [monthly] = await db.execute(`
            SELECT 
                DATE_FORMAT(created_at, '%b %Y') as month,
                DATE_FORMAT(created_at, '%Y-%m') as sort_key,
                COUNT(*) as count
            FROM students
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month, sort_key
            ORDER BY sort_key ASC
        `);

        // Fallback default months if no students yet
        let monthlyEnrollments = monthly;
        if (!monthlyEnrollments || monthlyEnrollments.length === 0) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            monthlyEnrollments = months.map(m => ({ month: m, count: 0 }));
        }

        res.json({
            students: studentsCount[0].count,
            activeStudents: activeStudentsCount[0].count,
            graduatedStudents: graduatedStudentsCount[0].count,
            teachers: teachersCount[0].count,
            pendingTeachers: pendingTeachersCount[0].count,
            programs: programsCount[0].count,
            cohorts: cohortsCount[0].count,
            modules: modulesCount[0].count,
            formations: formationsCount[0].count,
            pendingPayments: pendingPayments[0].count,
            revenue: Number(revenue[0].total) || 0,
            programDistribution: programDist.map(p => ({ name: p.name, students: Number(p.students) || 0 })),
            monthlyEnrollments
        });
    } catch (err) {
        console.error('[getAdminStats]', err);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
};

// --- STUDENT DASHBOARD ---
exports.getStudentStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const [student] = await db.execute('SELECT id, cohort_id FROM students WHERE user_id = ?', [userId]);

        if (student.length === 0) return res.status(404).json({ error: 'Student record not found' });

        const studentId = student[0].id;
        const cohortId = student[0].cohort_id;

        const [modulesCount] = await db.execute(`
      SELECT COUNT(*) as count FROM modules m
      JOIN cohorts c ON m.specialty_id = c.specialty_id
      WHERE c.id = ?
    `, [cohortId]);

        const [payments] = await db.execute('SELECT SUM(amount) as total FROM payments WHERE student_id = ? AND status = "approved"', [studentId]);

        res.json({
            enrolledModules: modulesCount[0].count,
            totalPaid: payments[0].total || 0,
            cohortId
        });
    } catch (err) {
        console.error('[getStudentStats]', err);
        res.status(500).json({ error: 'Failed to fetch student stats' });
    }
};

// --- TEACHER DASHBOARD ---
exports.getTeacherStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const [teacher] = await db.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);

        if (teacher.length === 0) return res.status(404).json({ error: 'Teacher record not found' });

        const teacherId = teacher[0].id;

        const [modules] = await db.execute('SELECT COUNT(*) as count FROM modules WHERE teacher_id = ?', [teacherId]);
        const [upcomingMeetings] = await db.execute('SELECT COUNT(*) as count FROM zoom_meetings WHERE host_id = ? AND scheduled_at > NOW()', [userId]);

        res.json({
            assignedModules: modules[0].count,
            upcomingMeetings: upcomingMeetings[0].count
        });
    } catch (err) {
        console.error('[getTeacherStats]', err);
        res.status(500).json({ error: 'Failed to fetch teacher stats' });
    }
};
