const db = require('../config/db');
const crypto = require('crypto');

// --- LESSONS ---
exports.getTeacherLessons = async (req, res) => {
    try {
        const [lessons] = await db.execute(`
            SELECT l.*, m.name as module_name, m.code as module_code, c.name as cohort_name 
            FROM lessons l
            LEFT JOIN modules m ON l.module_id = m.id
            LEFT JOIN cohorts c ON l.cohort_id = c.id
            WHERE l.teacher_id = ?
            ORDER BY l.scheduled_date DESC
        `, [req.user.id]);
        res.json(lessons);
    } catch (err) {
        console.error('[getTeacherLessons]', err);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
};

exports.createLesson = async (req, res) => {
    const { title, description, module_id, cohort_id, scheduled_date, duration_minutes } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO lessons (id, title, description, module_id, cohort_id, teacher_id, scheduled_date, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, module_id, cohort_id, req.user.id, scheduled_date, duration_minutes]
        );
        res.status(201).json({ id, title, description, module_id, cohort_id, scheduled_date, duration_minutes });
    } catch (err) {
        console.error('[createLesson]', err);
        res.status(500).json({ error: 'Failed to create lesson' });
    }
};

exports.updateLesson = async (req, res) => {
    const { id } = req.params;
    const { title, description, module_id, cohort_id, scheduled_date, duration_minutes } = req.body;
    try {
        // Enforce ownership: only the creator teacher or admin can update
        if (req.user.role !== 'admin') {
            const [check] = await db.execute('SELECT id FROM lessons WHERE id = ? AND teacher_id = ?', [id, req.user.id]);
            if (check.length === 0) return res.status(403).json({ error: 'Access denied: You can only update your own lessons' });
        }

        await db.execute(
            'UPDATE lessons SET title = ?, description = ?, module_id = ?, cohort_id = ?, scheduled_date = ?, duration_minutes = ? WHERE id = ?',
            [title, description, module_id, cohort_id, scheduled_date, duration_minutes, id]
        );
        res.json({ message: 'Lesson updated successfully' });
    } catch (err) {
        console.error('[updateLesson]', err);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
};

exports.deleteLesson = async (req, res) => {
    const { id } = req.params;
    try {
        // Enforce ownership: only the creator teacher or admin can delete
        if (req.user.role !== 'admin') {
            const [check] = await db.execute('SELECT id FROM lessons WHERE id = ? AND teacher_id = ?', [id, req.user.id]);
            if (check.length === 0) return res.status(403).json({ error: 'Access denied: You can only delete your own lessons' });
        }

        await db.execute('DELETE FROM lessons WHERE id = ?', [id]);
        res.json({ message: 'Lesson deleted successfully' });
    } catch (err) {
        console.error('[deleteLesson]', err);
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
};

// --- ATTENDANCE ---
exports.getLessonAttendance = async (req, res) => {
    const { lessonId } = req.params;
    try {
        // Enforce ownership: only the teacher assigned to the lesson or admin can view attendance
        if (req.user.role !== 'admin') {
            const [check] = await db.execute('SELECT id FROM lessons WHERE id = ? AND teacher_id = ?', [lessonId, req.user.id]);
            if (check.length === 0) return res.status(403).json({ error: 'Access denied: You do not teach this lesson' });
        }

        const [attendance] = await db.execute(`
            SELECT la.*, p.full_name, p.email 
            FROM lesson_attendance la
            JOIN students s ON la.student_id = s.id
            JOIN profiles p ON s.user_id = p.id
            WHERE la.lesson_id = ?
        `, [lessonId]);
        res.json(attendance);
    } catch (err) {
        console.error('[getLessonAttendance]', err);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

exports.markAttendance = async (req, res) => {
    const records = req.body; // Array of { lesson_id, student_id, status, notes }
    if (!Array.isArray(records)) {
        return res.status(400).json({ error: 'Records must be an array' });
    }
    try {
        // Enforce ownership: verify that the teacher owns each lesson
        if (req.user.role !== 'admin' && records.length > 0) {
            const uniqueLessons = [...new Set(records.map(r => r.lesson_id))];
            for (const lId of uniqueLessons) {
                const [check] = await db.execute('SELECT id FROM lessons WHERE id = ? AND teacher_id = ?', [lId, req.user.id]);
                if (check.length === 0) {
                    return res.status(403).json({ error: 'Access denied: You can only mark attendance for your own lessons' });
                }
            }
        }

        for (const record of records) {
            await db.execute(
                `INSERT INTO lesson_attendance (id, lesson_id, student_id, status, notes, marked_by, marked_at) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), marked_by = VALUES(marked_by), marked_at = NOW()`,
                [crypto.randomUUID(), record.lesson_id, record.student_id, record.status, record.notes || '', req.user.id]
            );
        }
        res.json({ message: 'Attendance marked successfully' });
    } catch (err) {
        console.error('[markAttendance]', err);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

// --- ASSIGNMENTS ---
exports.getTeacherAssignments = async (req, res) => {
    try {
        const [assignments] = await db.execute(`
            SELECT a.*, m.name as module_name, c.name as cohort_name,
            (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submissions_count
            FROM assignments a
            LEFT JOIN modules m ON a.module_id = m.id
            LEFT JOIN cohorts c ON a.cohort_id = c.id
            WHERE a.teacher_id = ?
            ORDER BY a.due_date DESC
        `, [req.user.id]);
        res.json(assignments);
    } catch (err) {
        console.error('[getTeacherAssignments]', err);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};

exports.createAssignment = async (req, res) => {
    const { title, description, module_id, cohort_id, due_date, max_grade } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO assignments (id, title, description, module_id, cohort_id, teacher_id, due_date, max_grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, module_id, cohort_id, req.user.id, due_date, max_grade]
        );
        res.status(201).json({ id, title, description, module_id, cohort_id, due_date, max_grade });
    } catch (err) {
        console.error('[createAssignment]', err);
        res.status(500).json({ error: 'Failed to create assignment' });
    }
};

exports.updateAssignment = async (req, res) => {
    const { id } = req.params;
    const { title, description, module_id, cohort_id, due_date, max_grade } = req.body;
    try {
        // Enforce ownership: only the creator teacher or admin can update
        if (req.user.role !== 'admin') {
            const [check] = await db.execute('SELECT id FROM assignments WHERE id = ? AND teacher_id = ?', [id, req.user.id]);
            if (check.length === 0) return res.status(403).json({ error: 'Access denied: You can only update your own assignments' });
        }

        await db.execute(
            'UPDATE assignments SET title = ?, description = ?, module_id = ?, cohort_id = ?, due_date = ?, max_grade = ? WHERE id = ?',
            [title, description, module_id, cohort_id, due_date, max_grade, id]
        );
        res.json({ message: 'Assignment updated successfully' });
    } catch (err) {
        console.error('[updateAssignment]', err);
        res.status(500).json({ error: 'Failed to update assignment' });
    }
};

exports.deleteAssignment = async (req, res) => {
    const { id } = req.params;
    try {
        // Enforce ownership: only the creator teacher or admin can delete
        if (req.user.role !== 'admin') {
            const [check] = await db.execute('SELECT id FROM assignments WHERE id = ? AND teacher_id = ?', [id, req.user.id]);
            if (check.length === 0) return res.status(403).json({ error: 'Access denied: You can only delete your own assignments' });
        }

        await db.execute('DELETE FROM assignments WHERE id = ?', [id]);
        res.json({ message: 'Assignment deleted successfully' });
    } catch (err) {
        console.error('[deleteAssignment]', err);
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
};

exports.getAssignmentSubmissions = async (req, res) => {
    const { id: assignmentId } = req.params;
    try {
        // Enforce ownership: only the assignment's teacher or admin can review submissions
        if (req.user.role !== 'admin') {
            const [check] = await db.execute('SELECT id FROM assignments WHERE id = ? AND teacher_id = ?', [assignmentId, req.user.id]);
            if (check.length === 0) return res.status(403).json({ error: 'Access denied: You do not own this assignment' });
        }

        const [submissions] = await db.execute(`
            SELECT s.*, p.full_name as student_name, p.email as student_email
            FROM assignment_submissions s
            JOIN students st ON s.student_id = st.id
            JOIN profiles p ON st.user_id = p.id
            WHERE s.assignment_id = ?
            ORDER BY s.submitted_at DESC
        `, [assignmentId]);

        res.json(submissions);
    } catch (err) {
        console.error('[getAssignmentSubmissions]', err);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
};

exports.gradeSubmission = async (req, res) => {
    const { submission_id, grade, feedback } = req.body;
    try {
        // Enforce ownership: verify submission belongs to an assignment owned by this teacher
        const [subRows] = await db.execute(`
            SELECT sub.id, a.teacher_id 
            FROM assignment_submissions sub
            JOIN assignments a ON sub.assignment_id = a.id
            WHERE sub.id = ?
        `, [submission_id]);

        if (subRows.length === 0) return res.status(404).json({ error: 'Submission not found' });

        if (req.user.role !== 'admin' && subRows[0].teacher_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied: You can only grade submissions for your own assignments' });
        }

        await db.execute(
            'UPDATE assignment_submissions SET grade = ?, feedback = ?, status = "graded", graded_at = NOW() WHERE id = ?',
            [grade, feedback || '', submission_id]
        );

        res.json({ message: 'Submission graded successfully' });
    } catch (err) {
        console.error('[gradeSubmission]', err);
        res.status(500).json({ error: 'Failed to grade submission' });
    }
};

// --- TEACHER ANNOUNCEMENTS / NEWS ---
exports.getTeacherNews = async (req, res) => {
    try {
        const [news] = await db.execute(`
            SELECT * FROM news WHERE author_id = ? ORDER BY created_at DESC
        `, [req.user.id]);
        res.json(news);
    } catch (err) {
        console.error('[getTeacherNews]', err);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
};

exports.createTeacherNews = async (req, res) => {
    const { title, content, type, priority, target_audience, is_published } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(`
            INSERT INTO news (id, title, content, type, priority, target_audience, is_published, author_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [id, title, content, type || 'announcement', priority || 'normal', target_audience || 'all', is_published !== false ? 1 : 0, req.user.id]);

        res.status(201).json({ id, title, content, type, priority, target_audience, is_published });
    } catch (err) {
        console.error('[createTeacherNews]', err);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
};

exports.updateTeacherNews = async (req, res) => {
    const { id } = req.params;
    const { title, content, type, priority, target_audience, is_published } = req.body;
    try {
        await db.execute(`
            UPDATE news 
            SET title = ?, content = ?, type = ?, priority = ?, target_audience = ?, is_published = ?, updated_at = NOW() 
            WHERE id = ? AND author_id = ?
        `, [title, content, type, priority, target_audience, is_published ? 1 : 0, id, req.user.id]);

        res.json({ id, title, content, type, priority, target_audience, is_published });
    } catch (err) {
        console.error('[updateTeacherNews]', err);
        res.status(500).json({ error: 'Failed to update announcement' });
    }
};

exports.deleteTeacherNews = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM news WHERE id = ? AND author_id = ?', [id, req.user.id]);
        res.json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('[deleteTeacherNews]', err);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
};

// --- FORMATION PROGRESS DASHBOARD ---
exports.getFormationProgressDashboard = async (req, res) => {
    try {
        let enrollmentSql = `
            SELECT fe.id, fe.formation_id, fe.student_id, fe.enrolled_at, fe.payment_status,
                   f.id as form_id, f.title as formation_title,
                   s.id as std_id, s.user_id as student_user_id,
                   p.full_name as student_name, p.email as student_email
            FROM formation_enrollments fe
            JOIN formations f ON fe.formation_id = f.id
            JOIN students s ON fe.student_id = s.id
            LEFT JOIN profiles p ON s.user_id = p.id
            WHERE fe.payment_status = 'approved'
        `;
        const params = [];
        if (req.user.role !== 'admin') {
            enrollmentSql += ' AND f.created_by = ?';
            params.push(req.user.id);
        }

        const [enrollments] = await db.execute(enrollmentSql, params);

        const [allContent] = await db.execute('SELECT id, formation_id FROM formation_content');
        const [allProgress] = await db.execute('SELECT * FROM formation_progress');

        const formattedEnrollments = enrollments.map(e => ({
            id: e.id,
            formation_id: e.formation_id,
            student_id: e.student_id,
            enrolled_at: e.enrolled_at,
            payment_status: e.payment_status,
            formation: { id: e.form_id, title: e.formation_title },
            student: {
                id: e.std_id,
                user_id: e.student_user_id,
                profile: { full_name: e.student_name, email: e.student_email }
            }
        }));

        res.json({
            enrollments: formattedEnrollments,
            allContent,
            allProgress
        });
    } catch (err) {
        console.error('[getFormationProgressDashboard]', err);
        res.status(500).json({ error: 'Failed to fetch formation progress dashboard' });
    }
};
