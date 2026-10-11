require('dotenv').config();
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const app = require('./server');

// Color helpers for terminal output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let server;
let baseUrl;
const testResults = [];

function recordResult(category, testName, endpoint, attackScenario, expected, actual, pass, severity = 'HIGH') {
    testResults.push({
        category,
        testName,
        endpoint,
        attackScenario,
        expected,
        actual,
        pass,
        severity
    });
    const mark = pass ? `${GREEN}✔ PASS${RESET}` : `${RED}✖ FAIL [${severity}]${RESET}`;
    console.log(`  ${mark} - [${category}] ${testName} (${endpoint})`);
    if (!pass) {
        console.log(`      ${YELLOW}Expected:${RESET} ${expected}`);
        console.log(`      ${RED}Actual:${RESET} ${actual}`);
    }
}

async function request(method, path, body = null, token = null, extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let bodyData = null;
    if (body) {
        headers['Content-Type'] = 'application/json';
        bodyData = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: bodyData
    });

    let data;
    const text = await res.text();
    try {
        data = JSON.parse(text);
    } catch (e) {
        data = text;
    }

    return { status: res.status, headers: res.headers, data };
}

// Fixture Data
const FIXTURES = {
    admin: { id: crypto.randomUUID(), email: `pentest_admin_${Date.now()}@test.local`, role: 'admin' },
    teacherA: { id: crypto.randomUUID(), teacherId: crypto.randomUUID(), email: `pentest_teacher_a_${Date.now()}@test.local`, role: 'teacher' },
    teacherB: { id: crypto.randomUUID(), teacherId: crypto.randomUUID(), email: `pentest_teacher_b_${Date.now()}@test.local`, role: 'teacher' },
    studentA: { id: crypto.randomUUID(), studentId: crypto.randomUUID(), email: `pentest_student_a_${Date.now()}@test.local`, role: 'student' },
    studentB: { id: crypto.randomUUID(), studentId: crypto.randomUUID(), email: `pentest_student_b_${Date.now()}@test.local`, role: 'student' },
    suspendedStudent: { id: crypto.randomUUID(), studentId: crypto.randomUUID(), email: `pentest_suspended_${Date.now()}@test.local`, role: 'student' },
    program: { id: crypto.randomUUID(), name: 'PenTest Program' },
    specialty: { id: crypto.randomUUID(), name: 'PenTest Specialty' },
    cohortA: { id: crypto.randomUUID(), name: 'PenTest Cohort A' },
    cohortB: { id: crypto.randomUUID(), name: 'PenTest Cohort B' },
    moduleA: { id: crypto.randomUUID(), code: 'PT-101', name: 'PenTest Module A' },
    lessonA: { id: crypto.randomUUID(), title: 'Lesson Teacher A' },
    lessonB: { id: crypto.randomUUID(), title: 'Lesson Teacher B' },
    assignmentA: { id: crypto.randomUUID(), title: 'Assignment Teacher A' },
    assignmentB: { id: crypto.randomUUID(), title: 'Assignment Teacher B' },
    formationPaid: { id: crypto.randomUUID(), title: 'Paid Formation $100', price: 100.00 },
    enrollmentB: { id: crypto.randomUUID() },
    conversationAB: { id: crypto.randomUUID() },
    paymentA: { id: crypto.randomUUID() }
};

let tokens = {};

async function setupFixtures() {
    console.log(`\n${CYAN}>>> Setting up test fixtures in MySQL database...${RESET}`);
    const hash = await bcrypt.hash('Password123!', 8);

    // Create Program, Specialty, Cohorts
    await db.execute('INSERT INTO programs (id, name, description, duration) VALUES (?, ?, ?, ?)', [FIXTURES.program.id, FIXTURES.program.name, 'Test', '1 year']);
    await db.execute('INSERT INTO specialties (id, name, program_id) VALUES (?, ?, ?)', [FIXTURES.specialty.id, FIXTURES.specialty.name, FIXTURES.program.id]);
    await db.execute('INSERT INTO cohorts (id, name, specialty_id) VALUES (?, ?, ?)', [FIXTURES.cohortA.id, FIXTURES.cohortA.name, FIXTURES.specialty.id]);
    await db.execute('INSERT INTO cohorts (id, name, specialty_id) VALUES (?, ?, ?)', [FIXTURES.cohortB.id, FIXTURES.cohortB.name, FIXTURES.specialty.id]);

    // Create Users & Roles
    const users = [
        { ...FIXTURES.admin, status: 'active' },
        { ...FIXTURES.teacherA, status: 'active' },
        { ...FIXTURES.teacherB, status: 'active' },
        { ...FIXTURES.studentA, status: 'active' },
        { ...FIXTURES.studentB, status: 'active' },
        { ...FIXTURES.suspendedStudent, status: 'suspended' }
    ];

    for (const u of users) {
        await db.execute('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)', [u.id, u.email, hash, u.role]);
        await db.execute('INSERT INTO profiles (id, email, full_name) VALUES (?, ?, ?)', [u.id, u.email, u.email.split('@')[0]]);
        await db.execute('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)', [crypto.randomUUID(), u.id, u.role]);
    }

    // Teacher records
    await db.execute('INSERT INTO teachers (id, user_id, status) VALUES (?, ?, "active")', [FIXTURES.teacherA.teacherId, FIXTURES.teacherA.id]);
    await db.execute('INSERT INTO teachers (id, user_id, status) VALUES (?, ?, "active")', [FIXTURES.teacherB.teacherId, FIXTURES.teacherB.id]);

    // Student records
    await db.execute('INSERT INTO students (id, user_id, cohort_id, status) VALUES (?, ?, ?, "active")', [FIXTURES.studentA.studentId, FIXTURES.studentA.id, FIXTURES.cohortA.id]);
    await db.execute('INSERT INTO students (id, user_id, cohort_id, status) VALUES (?, ?, ?, "active")', [FIXTURES.studentB.studentId, FIXTURES.studentB.id, FIXTURES.cohortB.id]);
    await db.execute('INSERT INTO students (id, user_id, status) VALUES (?, ?, "suspended")', [FIXTURES.suspendedStudent.studentId, FIXTURES.suspendedStudent.id]);

    // Module A taught by Teacher A
    await db.execute('INSERT INTO modules (id, code, name, specialty_id, teacher_id) VALUES (?, ?, ?, ?, ?)',
        [FIXTURES.moduleA.id, FIXTURES.moduleA.code, FIXTURES.moduleA.name, FIXTURES.specialty.id, FIXTURES.teacherA.teacherId]);

    // Lessons
    await db.execute('INSERT INTO lessons (id, title, module_id, cohort_id, teacher_id, scheduled_date, duration_minutes) VALUES (?, ?, ?, ?, ?, NOW(), 60)',
        [FIXTURES.lessonA.id, FIXTURES.lessonA.title, FIXTURES.moduleA.id, FIXTURES.cohortA.id, FIXTURES.teacherA.id]);
    await db.execute('INSERT INTO lessons (id, title, module_id, cohort_id, teacher_id, scheduled_date, duration_minutes) VALUES (?, ?, ?, ?, ?, NOW(), 60)',
        [FIXTURES.lessonB.id, FIXTURES.lessonB.title, FIXTURES.moduleA.id, FIXTURES.cohortB.id, FIXTURES.teacherB.id]);

    // Assignments
    await db.execute('INSERT INTO assignments (id, title, module_id, cohort_id, teacher_id, due_date, max_grade) VALUES (?, ?, ?, ?, ?, NOW() + INTERVAL 7 DAY, 100)',
        [FIXTURES.assignmentA.id, FIXTURES.assignmentA.title, FIXTURES.moduleA.id, FIXTURES.cohortA.id, FIXTURES.teacherA.id]);
    await db.execute('INSERT INTO assignments (id, title, module_id, cohort_id, teacher_id, due_date, max_grade) VALUES (?, ?, ?, ?, ?, NOW() + INTERVAL 7 DAY, 100)',
        [FIXTURES.assignmentB.id, FIXTURES.assignmentB.title, FIXTURES.moduleA.id, FIXTURES.cohortB.id, FIXTURES.teacherB.id]);

    // Formation Paid ($100) created by Teacher A
    await db.execute('INSERT INTO formations (id, title, price, currency, is_published, created_by) VALUES (?, ?, ?, "USD", 1, ?)',
        [FIXTURES.formationPaid.id, FIXTURES.formationPaid.title, FIXTURES.formationPaid.price, FIXTURES.teacherA.id]);
    await db.execute('INSERT INTO formation_content (id, formation_id, title, content_type, file_url, duration_seconds) VALUES (?, ?, "Video 1", "video", "http://test.local/video.mp4", 120)',
        [crypto.randomUUID(), FIXTURES.formationPaid.id]);

    // Pending enrollment for Student B
    await db.execute('INSERT INTO formation_enrollments (id, formation_id, student_id, payment_status) VALUES (?, ?, ?, "pending")',
        [FIXTURES.enrollmentB.id, FIXTURES.formationPaid.id, FIXTURES.studentB.studentId]);

    // Direct Conversation between Student A and Teacher A
    await db.execute('INSERT INTO conversations (id, type) VALUES (?, "direct")', [FIXTURES.conversationAB.id]);
    await db.execute('INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?, ?, ?)', [crypto.randomUUID(), FIXTURES.conversationAB.id, FIXTURES.studentA.id]);
    await db.execute('INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?, ?, ?)', [crypto.randomUUID(), FIXTURES.conversationAB.id, FIXTURES.teacherA.id]);
    const msgId = crypto.randomUUID();
    await db.execute('INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, "Secret message between A and Teacher A")',
        [msgId, FIXTURES.conversationAB.id, FIXTURES.studentA.id]);
    FIXTURES.messageAB = { id: msgId };

    // Payment submitted by Student A
    await db.execute('INSERT INTO payments (id, student_id, amount, payment_method, status) VALUES (?, ?, 500, "manual", "pending")',
        [FIXTURES.paymentA.id, FIXTURES.studentA.studentId]);

    // Generate JWTs
    tokens.admin = jwt.sign({ id: FIXTURES.admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' });
    tokens.teacherA = jwt.sign({ id: FIXTURES.teacherA.id, role: 'teacher' }, process.env.JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' });
    tokens.teacherB = jwt.sign({ id: FIXTURES.teacherB.id, role: 'teacher' }, process.env.JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' });
    tokens.studentA = jwt.sign({ id: FIXTURES.studentA.id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' });
    tokens.studentB = jwt.sign({ id: FIXTURES.studentB.id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' });
    tokens.suspendedStudent = jwt.sign({ id: FIXTURES.suspendedStudent.id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' });

    console.log(`${GREEN}>>> Fixtures successfully populated.${RESET}\n`);
}

async function teardownFixtures() {
    console.log(`\n${CYAN}>>> Cleaning up penetration test fixtures...${RESET}`);
    try {
        const userIds = [
            FIXTURES.admin.id, FIXTURES.teacherA.id, FIXTURES.teacherB.id,
            FIXTURES.studentA.id, FIXTURES.studentB.id, FIXTURES.suspendedStudent.id
        ];
        for (const u of userIds) {
            await db.execute('DELETE FROM payments WHERE student_id IN (SELECT id FROM students WHERE user_id = ?)', [u]);
            await db.execute('DELETE FROM formation_enrollments WHERE student_id IN (SELECT id FROM students WHERE user_id = ?)', [u]);
            await db.execute('DELETE FROM students WHERE user_id = ?', [u]);
            await db.execute('DELETE FROM teachers WHERE user_id = ?', [u]);
            await db.execute('DELETE FROM user_roles WHERE user_id = ?', [u]);
            await db.execute('DELETE FROM profiles WHERE id = ?', [u]);
            await db.execute('DELETE FROM users WHERE id = ?', [u]);
        }
        await db.execute('DELETE FROM messages WHERE conversation_id = ?', [FIXTURES.conversationAB.id]);
        await db.execute('DELETE FROM conversation_participants WHERE conversation_id = ?', [FIXTURES.conversationAB.id]);
        await db.execute('DELETE FROM conversations WHERE id = ?', [FIXTURES.conversationAB.id]);
        await db.execute('DELETE FROM formation_content WHERE formation_id = ?', [FIXTURES.formationPaid.id]);
        await db.execute('DELETE FROM formations WHERE id = ?', [FIXTURES.formationPaid.id]);
        await db.execute('DELETE FROM assignments WHERE id IN (?, ?)', [FIXTURES.assignmentA.id, FIXTURES.assignmentB.id]);
        await db.execute('DELETE FROM lessons WHERE id IN (?, ?)', [FIXTURES.lessonA.id, FIXTURES.lessonB.id]);
        await db.execute('DELETE FROM modules WHERE id = ?', [FIXTURES.moduleA.id]);
        await db.execute('DELETE FROM cohorts WHERE id IN (?, ?)', [FIXTURES.cohortA.id, FIXTURES.cohortB.id]);
        await db.execute('DELETE FROM specialties WHERE id = ?', [FIXTURES.specialty.id]);
        await db.execute('DELETE FROM programs WHERE id = ?', [FIXTURES.program.id]);
        console.log(`${GREEN}>>> Cleanup completed.${RESET}\n`);
    } catch (e) {
        console.error('Error during cleanup:', e.message);
    }
}

async function runPenetrationSuite() {
    console.log(`${CYAN}========================================================================${RESET}`);
    console.log(`${CYAN}   SIMPLY UNIVERSITY - ADVERSARIAL PENETRATION TESTING SUITE           ${RESET}`);
    console.log(`${CYAN}========================================================================${RESET}\n`);

    // ─── 1. IDOR TESTING ──────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}[CATEGORY 1: IDOR & Horizontal Privilege Escalation]${RESET}`);

    // Test 1.1: Student A attempts to read Student B's profile via query/body tampering
    {
        const res = await request('GET', `/api/user/profile?user_id=${FIXTURES.studentB.id}`, null, tokens.studentA);
        const pass = res.status === 200 && res.data.id === FIXTURES.studentA.id && res.data.id !== FIXTURES.studentB.id;
        recordResult('IDOR', 'Profile Isolation against query parameter tampering', '/api/user/profile',
            'Student A sends ?user_id=StudentB to steal private profile data',
            'Server returns Student A\'s own profile (200), ignoring user_id query param',
            `Status ${res.status}, Profile ID returned: ${res.data?.id}`,
            pass, 'CRITICAL');
    }

    // Test 1.2: Student A attempts to read Student B's academic record
    {
        const res = await request('GET', `/api/student/record?id=${FIXTURES.studentB.id}`, null, tokens.studentA);
        const pass = res.status === 200 && res.data.user_id === FIXTURES.studentA.id;
        recordResult('IDOR', 'Student Record Isolation', '/api/student/record',
            'Student A attempts to view Student B\'s academic record',
            'Server returns Student A\'s own record strictly via token identity',
            `Status ${res.status}, Record user_id: ${res.data?.user_id}`,
            pass, 'CRITICAL');
    }

    // Test 1.3: Teacher B attempts to view Attendance of Teacher A's lesson
    {
        const res = await request('GET', `/api/teacher/attendance/${FIXTURES.lessonA.id}`, null, tokens.teacherB);
        const pass = res.status === 403;
        recordResult('IDOR', 'Cross-Teacher Lesson Attendance View Access', `/api/teacher/attendance/${FIXTURES.lessonA.id}`,
            'Teacher B attempts to view attendance roster of Teacher A\'s lesson',
            'Server blocks request with 403 Forbidden',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'HIGH');
    }

    // Test 1.4: Teacher B attempts to Mark Attendance on Teacher A's lesson
    {
        const res = await request('POST', '/api/teacher/attendance', [
            { lesson_id: FIXTURES.lessonA.id, student_id: FIXTURES.studentA.studentId, status: 'absent' }
        ], tokens.teacherB);
        const pass = res.status === 403;
        recordResult('IDOR', 'Cross-Teacher Attendance Tampering', '/api/teacher/attendance',
            'Teacher B attempts to submit attendance for a lesson owned by Teacher A',
            'Server blocks request with 403 Forbidden',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'HIGH');
    }

    // Test 1.5: Teacher B attempts to Update Teacher A's Lesson
    {
        const res = await request('PUT', `/api/teacher/lessons/${FIXTURES.lessonA.id}`, {
            title: 'Hacked Lesson Title'
        }, tokens.teacherB);
        const pass = res.status === 403;
        recordResult('IDOR', 'Cross-Teacher Lesson Modification', `/api/teacher/lessons/${FIXTURES.lessonA.id}`,
            'Teacher B attempts to update title/schedule of Teacher A\'s lesson',
            'Server blocks with 403 Forbidden',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'HIGH');
    }

    // Test 1.6: Teacher B attempts to Delete Teacher A's Lesson
    {
        const res = await request('DELETE', `/api/teacher/lessons/${FIXTURES.lessonA.id}`, null, tokens.teacherB);
        const pass = res.status === 403;
        recordResult('IDOR', 'Cross-Teacher Lesson Deletion', `/api/teacher/lessons/${FIXTURES.lessonA.id}`,
            'Teacher B attempts to delete Teacher A\'s lesson',
            'Server blocks with 403 Forbidden',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'HIGH');
    }

    // Test 1.7: Teacher B attempts to View Submissions of Teacher A's Assignment
    {
        const res = await request('GET', `/api/teacher/assignments/${FIXTURES.assignmentA.id}/submissions`, null, tokens.teacherB);
        const pass = res.status === 403;
        recordResult('IDOR', 'Cross-Teacher Assignment Submissions Snooping', `/api/teacher/assignments/:id/submissions`,
            'Teacher B attempts to view student submissions for Teacher A\'s assignment',
            'Server blocks with 403 Forbidden',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'HIGH');
    }

    // Test 1.8: Teacher B attempts to Grade a Submission on Teacher A's Assignment
    {
        // First, Student A submits assignment to Assignment A
        await request('POST', '/api/student/submit-assignment', {
            assignment_id: FIXTURES.assignmentA.id,
            submission_url: 'http://test.local/work.pdf'
        }, tokens.studentA);

        const [subRows] = await db.execute('SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
            [FIXTURES.assignmentA.id, FIXTURES.studentA.studentId]);
        const subId = subRows[0]?.id;

        const res = await request('POST', '/api/teacher/assignments/grade', {
            submission_id: subId,
            grade: 0,
            feedback: 'Malicious 0 grade from unauthorized teacher'
        }, tokens.teacherB);

        const pass = res.status === 403;
        recordResult('IDOR', 'Unauthorized Teacher Grading Student Assignment', '/api/teacher/assignments/grade',
            'Teacher B attempts to assign a grade to Teacher A\'s student submission',
            'Server blocks with 403 Forbidden',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'HIGH');
    }

    // Test 1.9: Non-participant eavesdropping on private chat messages
    {
        const res = await request('GET', `/api/chat/conversations/${FIXTURES.conversationAB.id}/messages`, null, tokens.studentB);
        const pass = res.status === 403;
        recordResult('IDOR', 'Chat Eavesdropping by Non-participant', `/api/chat/conversations/:id/messages`,
            'Student B (non-participant) attempts to read messages of Conversation AB',
            'Server blocks with 403 Forbidden',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'CRITICAL');
    }

    // Test 1.10: Non-participant injecting message into private conversation
    {
        const res = await request('POST', `/api/chat/conversations/${FIXTURES.conversationAB.id}/messages`, {
            content: 'Injected forged message from outsider'
        }, tokens.studentB);
        const pass = res.status === 403;
        recordResult('IDOR', 'Chat Message Injection by Non-participant', `/api/chat/conversations/:id/messages`,
            'Student B attempts to inject a message into a conversation they are not in',
            'Server blocks with 403 Forbidden',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'CRITICAL');
    }

    // Test 1.11: Student A accessing Paid Formation Content without approved payment
    {
        const res = await request('GET', `/api/formation/${FIXTURES.formationPaid.id}/content`, null, tokens.studentA);
        const pass = res.status === 403;
        recordResult('IDOR', 'Unpaid User Bypassing Paywall for Course Content', `/api/formation/:id/content`,
            'Student A attempts to retrieve video/lecture URLs of a paid $100 course without enrolling',
            'Server blocks with 403 Forbidden (approved payment required)',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'CRITICAL');
    }

    // Test 1.12: Student A forging/reading Student B's Formation Progress
    {
        const res = await request('GET', `/api/formation/progress/${FIXTURES.enrollmentB.id}`, null, tokens.studentA);
        const pass = res.status === 403;
        recordResult('IDOR', 'Cross-Student Formation Progress Access', `/api/formation/progress/:enrollmentId`,
            'Student A attempts to view progress of Student B\'s enrollment',
            'Server blocks with 403 Forbidden (not your enrollment)',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'HIGH');
    }

    // ─── 2. ROLE ESCALATION & MASS ASSIGNMENT ─────────────────────────────────────
    console.log(`\n${YELLOW}[CATEGORY 2: Role Escalation & Mass Assignment]${RESET}`);

    // Test 2.1: Attacker registers with role=admin
    {
        const attackerEmail = `attacker_admin_${Date.now()}@test.local`;
        const res = await request('POST', '/api/auth/register', {
            email: attackerEmail,
            password: 'Password123!',
            fullName: 'Malicious Admin Wannabe',
            role: 'admin'
        });

        // Check in database what role was actually assigned
        const [rows] = await db.execute('SELECT role FROM users WHERE email = ?', [attackerEmail]);
        const actualDbRole = rows[0]?.role;
        const pass = res.status === 201 && actualDbRole === 'student';

        recordResult('Role Escalation', 'Register with role=admin payload', '/api/auth/register',
            'Attacker supplies role="admin" during self-registration',
            'Server silently overrides or enforces role to student; DB role must be student',
            `HTTP Status: ${res.status}, Database Role assigned: "${actualDbRole}"`,
            pass, 'CRITICAL');

        if (rows[0]) await db.execute('DELETE FROM users WHERE email = ?', [attackerEmail]);
    }

    // Test 2.2: Attacker injects role=admin into Profile Update
    {
        const res = await request('PUT', '/api/user/profile', {
            full_name: 'Privilege Escalation Tester',
            role: 'admin',
            is_admin: true,
            permissions: ['admin', 'all']
        }, tokens.studentA);

        const [rows] = await db.execute('SELECT role FROM users WHERE id = ?', [FIXTURES.studentA.id]);
        const pass = res.status === 200 && rows[0]?.role === 'student';

        recordResult('Role Escalation', 'Mass Assignment on Profile Update', '/api/user/profile',
            'Student A sends { role: "admin", is_admin: true } to updateProfile',
            'Server ignores role fields; Database role remains "student"',
            `Database Role: "${rows[0]?.role}"`,
            pass, 'CRITICAL');
    }

    // Test 2.3: Student attempts to approve a payment via body status injection
    {
        const res = await request('POST', '/api/payment/submit', {
            programId: FIXTURES.program.id,
            amount: 250,
            status: 'approved',
            reviewed_by: FIXTURES.studentA.id,
            student_id: FIXTURES.studentB.studentId
        }, tokens.studentA);

        const paymentId = res.data?.id;
        const [rows] = await db.execute('SELECT status, student_id FROM payments WHERE id = ?', [paymentId]);
        const pass = rows.length > 0 && rows[0].status === 'pending' && rows[0].student_id === FIXTURES.studentA.studentId;

        recordResult('Mass Assignment', 'Payment Submission status and student_id injection', '/api/payment/submit',
            'Student supplies status="approved" and student_id=StudentB in payment submission',
            'Server overrides status to "pending" and binds student_id strictly to caller',
            `Status in DB: "${rows[0]?.status}", Bound student_id: "${rows[0]?.student_id}"`,
            pass, 'CRITICAL');

        if (paymentId) await db.execute('DELETE FROM payments WHERE id = ?', [paymentId]);
    }

    // ─── 3. JWT SECURITY ─────────────────────────────────────────────────────────
    console.log(`\n${YELLOW}[CATEGORY 3: JWT Security & Token Tampering]${RESET}`);

    // Test 3.1: Token with forged payload and invalid signature
    {
        const forgedToken = jwt.sign({ id: FIXTURES.admin.id, role: 'admin' }, 'WRONG_SECRET_KEY_123', { algorithm: 'HS256' });
        const res = await request('GET', '/api/admin/users', null, forgedToken);
        const pass = res.status === 401;
        recordResult('JWT Security', 'Forged Signature Detection', '/api/admin/users',
            'Attacker signs admin claims with a random secret key',
            'Server rejects with 401 Token is not valid',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'CRITICAL');
    }

    // Test 3.2: Expired Token
    {
        const expiredToken = jwt.sign({ id: FIXTURES.admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
        const res = await request('GET', '/api/admin/users', null, expiredToken);
        const pass = res.status === 401;
        recordResult('JWT Security', 'Expired Token Rejection', '/api/admin/users',
            'Attacker uses a cryptographically valid but expired JWT token',
            'Server rejects with 401 Token is not valid',
            `Status: ${res.status}`,
            pass, 'HIGH');
    }

    // Test 3.3: Token for deleted/non-existent user
    {
        const ghostToken = jwt.sign({ id: crypto.randomUUID(), role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const res = await request('GET', '/api/admin/users', null, ghostToken);
        const pass = res.status === 401;
        recordResult('JWT Security', 'Validly-Signed Ghost/Deleted User Token', '/api/admin/users',
            'Token has valid signature but user record does not exist in MySQL database',
            'Server double-checks DB, finds no user, and returns 401 User no longer exists',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'CRITICAL');
    }

    // Test 3.4: Suspended Student Token
    {
        const res = await request('GET', '/api/student/record', null, tokens.suspendedStudent);
        // Suspended student: when trying to login they are blocked with 403
        const loginRes = await request('POST', '/api/auth/login', {
            email: FIXTURES.suspendedStudent.email,
            password: 'Password123!'
        });
        const pass = loginRes.status === 403 && loginRes.data.error.includes('suspended');
        recordResult('JWT Security', 'Suspended Account Login Rejection', '/api/auth/login',
            'Suspended student attempts to login and generate token',
            'Server returns 403 Your account has been suspended',
            `Status: ${loginRes.status} (${JSON.stringify(loginRes.data)})`,
            pass, 'HIGH');
    }

    // ─── 4. ADMIN-ONLY ENDPOINTS & ROUTE GUARDS ──────────────────────────────────
    console.log(`\n${YELLOW}[CATEGORY 4: Admin-Only Route Guards & Privilege Separation]${RESET}`);

    // Test 4.1: Student accessing Users Management
    {
        const res = await request('GET', '/api/admin/users', null, tokens.studentA);
        const pass = res.status === 403;
        recordResult('Admin Guards', 'Student accessing Admin Users list', '/api/admin/users',
            'Student A attempts to retrieve list of all platform users and credentials',
            'Server blocks with 403 Access denied: insufficient permissions',
            `Status: ${res.status}`,
            pass, 'CRITICAL');
    }

    // Test 4.2: Teacher accessing Users Management
    {
        const res = await request('GET', '/api/admin/users', null, tokens.teacherA);
        const pass = res.status === 403;
        recordResult('Admin Guards', 'Teacher accessing Admin Users list', '/api/admin/users',
            'Teacher A attempts to access admin users endpoint',
            'Server blocks with 403 Access denied: insufficient permissions',
            `Status: ${res.status}`,
            pass, 'CRITICAL');
    }

    // Test 4.3: Student modifying User Roles
    {
        const res = await request('PUT', `/api/admin/users/${FIXTURES.studentA.id}/role`, { role: 'admin' }, tokens.studentA);
        const pass = res.status === 403;
        recordResult('Admin Guards', 'Student calling updateUserRole endpoint', `/api/admin/users/:id/role`,
            'Student attempts to change their own role to admin via admin API',
            'Server blocks with 403 Access denied: insufficient permissions',
            `Status: ${res.status}`,
            pass, 'CRITICAL');
    }

    // Test 4.4: Student calling Admin Impersonation
    {
        const res = await request('POST', `/api/academic/students/${FIXTURES.studentB.studentId}/impersonate`, null, tokens.studentA);
        const pass = res.status === 403;
        recordResult('Admin Guards', 'Student calling Impersonate Student API', '/api/academic/students/:id/impersonate',
            'Student A attempts to call impersonation endpoint on Student B',
            'Server blocks with 403 Access denied: insufficient permissions',
            `Status: ${res.status}`,
            pass, 'CRITICAL');
    }

    // Test 4.5: Teacher calling Admin Impersonation
    {
        const res = await request('POST', `/api/academic/students/${FIXTURES.studentB.studentId}/impersonate`, null, tokens.teacherA);
        const pass = res.status === 403;
        recordResult('Admin Guards', 'Teacher calling Impersonate Student API', '/api/academic/students/:id/impersonate',
            'Teacher A attempts to call student impersonation endpoint',
            'Server blocks with 403 Access denied: insufficient permissions',
            `Status: ${res.status}`,
            pass, 'CRITICAL');
    }

    // Test 4.6: Student accessing Platform Settings
    {
        const res = await request('POST', '/api/admin/settings', { key: 'hacked', value: 'true' }, tokens.studentA);
        const pass = res.status === 403;
        recordResult('Admin Guards', 'Student modifying Platform Settings', '/api/admin/settings',
            'Student attempts to update platform settings',
            'Server blocks with 403 Access denied',
            `Status: ${res.status}`,
            pass, 'CRITICAL');
    }

    // Test 4.7: Student accessing SMTP Email Settings
    {
        const res = await request('GET', '/api/admin/email/settings', null, tokens.studentA);
        const pass = res.status === 403;
        recordResult('Admin Guards', 'Student accessing SMTP Settings & Passwords', '/api/admin/email/settings',
            'Student attempts to read email SMTP configuration',
            'Server blocks with 403 Access denied',
            `Status: ${res.status}`,
            pass, 'CRITICAL');
    }

    // ─── 5. BUSINESS LOGIC & STATE TAMPERING ──────────────────────────────────────
    console.log(`\n${YELLOW}[CATEGORY 5: Business Logic & State Tampering]${RESET}`);

    // Test 5.1: Student attempting to self-approve a payment
    {
        const res = await request('PUT', `/api/payment/${FIXTURES.paymentA.id}/status`, {
            status: 'approved',
            adminNotes: 'Self-approved by attacker'
        }, tokens.studentA);
        const pass = res.status === 403;
        recordResult('Business Logic', 'Student self-approving academic payment', `/api/payment/:id/status`,
            'Student A sends PUT to approve their own pending payment',
            'Server blocks with 403 Access denied: insufficient permissions',
            `Status: ${res.status}`,
            pass, 'CRITICAL');
    }

    // Test 5.2: Student submitting to an assignment belonging to another cohort
    {
        const res = await request('POST', '/api/student/submit-assignment', {
            assignment_id: FIXTURES.assignmentB.id, // Cohort B assignment
            submission_url: 'http://test.local/work_b.pdf'
        }, tokens.studentA); // Student A belongs to Cohort A
        const pass = res.status === 403;
        recordResult('Business Logic', 'Submitting assignment belonging to different cohort', '/api/student/submit-assignment',
            'Student A attempts to submit work to an assignment in Cohort B',
            'Server blocks with 403 This assignment belongs to a different cohort',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'HIGH');
    }

    // Test 5.3: Overwriting a graded assignment
    {
        // First grade the submission as Teacher A
        const [subRows] = await db.execute('SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
            [FIXTURES.assignmentA.id, FIXTURES.studentA.studentId]);
        if (subRows.length > 0) {
            await db.execute('UPDATE assignment_submissions SET grade = 85, status = "graded" WHERE id = ?', [subRows[0].id]);
        }

        // Student tries to resubmit
        const res = await request('POST', '/api/student/submit-assignment', {
            assignment_id: FIXTURES.assignmentA.id,
            submission_url: 'http://test.local/resubmission.pdf'
        }, tokens.studentA);

        const pass = res.status === 400 && res.data.error.includes('already been graded');
        recordResult('Business Logic', 'Resubmitting already-graded assignment', '/api/student/submit-assignment',
            'Student attempts to overwrite an assignment submission that has already been graded',
            'Server rejects with 400 cannot be resubmitted',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'MEDIUM');
    }

    // Test 5.4: Sole Admin self-deletion prevention
    {
        const res = await request('DELETE', '/api/user/account', { password: 'Password123!' }, tokens.admin);
        // If there's only 1 admin, it must reject
        const [adminCount] = await db.execute("SELECT COUNT(*) as count FROM user_roles WHERE role = 'admin'");
        let pass;
        if (adminCount[0].count <= 1) {
            pass = res.status === 400 && res.data.error.includes('sole administrator');
        } else {
            pass = true; // Multiple admins exist in system
        }
        recordResult('Business Logic', 'Sole Administrator Account Deletion Lockout', '/api/user/account',
            'The only admin attempts to delete their own account',
            'Server prevents self-deletion if sole admin (400 Cannot delete the sole administrator account)',
            `Status: ${res.status} (${JSON.stringify(res.data)})`,
            pass, 'HIGH');
    }

    // ─── 6. RACE CONDITIONS ───────────────────────────────────────────────────────
    console.log(`\n${YELLOW}[CATEGORY 6: Race Conditions & Concurrency]${RESET}`);

    // Test 6.1: Concurrent First Admin Setup (Atomic Check)
    {
        // Both requests attempt to set themselves up as admin simultaneously
        const p1 = request('POST', '/api/auth/setup-admin', null, tokens.studentA);
        const p2 = request('POST', '/api/auth/setup-admin', null, tokens.studentB);
        const [r1, r2] = await Promise.all([p1, p2]);

        // Since an admin already exists in the system, BOTH must fail with 400
        const pass = (r1.status === 400 && r1.data.error.includes('already exists')) &&
                     (r2.status === 400 && r2.data.error.includes('already exists'));

        recordResult('Race Condition', 'Concurrent First Admin Setup', '/api/auth/setup-admin',
            'Two users simultaneously execute setup-admin to hijack the admin role',
            'Atomic query prevents any race condition; rejects both with 400',
            `Req1: ${r1.status}, Req2: ${r2.status}`,
            pass, 'CRITICAL');
    }

    // ─── 7. ERROR LEAKS & INFORMATION DISCLOSURE ──────────────────────────────────
    console.log(`\n${YELLOW}[CATEGORY 7: Information Disclosure & Error Sanitization]${RESET}`);

    // Test 7.1: SQL Syntax Injection Error Sanitization
    {
        const res = await request('GET', "/api/academic/programs/' OR 1=1 --", null, tokens.studentA);
        const bodyStr = JSON.stringify(res.data);
        const hasSqlLeak = bodyStr.includes('SQL syntax') || bodyStr.includes('MySQL') || bodyStr.includes('SELECT * FROM');
        const pass = !hasSqlLeak;

        recordResult('Error Sanitization', 'SQL Injection error leakage test', "/api/academic/programs/:id",
            'Attacker supplies SQL payload in URL parameter to trigger database syntax error',
            'Server does not leak database table names, SQL syntax, or stack trace in response',
            `Status: ${res.status}, SQL strings in body: ${hasSqlLeak ? 'LEAKED' : 'NONE'}`,
            pass, 'HIGH');
    }

    // Test 7.2: Password Hash Exposure in User Queries
    {
        const res = await request('GET', '/api/user/profile', null, tokens.studentA);
        const hasPasswordLeak = res.data?.password || res.data?.password_hash;
        const pass = !hasPasswordLeak;

        recordResult('Information Disclosure', 'Password hash leakage in profile response', '/api/user/profile',
            'User queries own profile data',
            'Response must never contain password hash or plaintext password',
            `Password fields present: ${hasPasswordLeak ? 'YES' : 'NONE'}`,
            pass, 'CRITICAL');
    }

    // ─── 8. RATE LIMITING & BRUTE FORCE ───────────────────────────────────────────
    console.log(`\n${YELLOW}[CATEGORY 8: Rate Limiting & Brute Force Protection]${RESET}`);

    // Test 8.1: Brute Force on Auth Login (authLimiter)
    {
        console.log(`      ...sending rapid authentication attempts to verify rate limiter...`);
        let wasRateLimited = false;
        let finalStatus = 0;
        for (let i = 0; i < 15; i++) {
            const res = await request('POST', '/api/auth/login', {
                email: 'nonexistent_test_user@test.local',
                password: 'WrongPassword123!'
            });
            if (res.status === 429) {
                wasRateLimited = true;
                finalStatus = 429;
                break;
            }
        }

        const pass = wasRateLimited;
        recordResult('Rate Limiting', 'Authentication Brute-Force Limiter (10 req/15min)', '/api/auth/login',
            'Attacker floods login endpoint with rapid credential attempts',
            'Server triggers 429 Too Many Requests after 10 attempts',
            `Rate limit triggered: ${wasRateLimited ? 'YES (HTTP 429)' : 'NO'}`,
            pass, 'HIGH');
    }

    console.log(`\n${CYAN}========================================================================${RESET}`);
    console.log(`${CYAN}   PENETRATION TEST EXECUTION SUMMARY                                   ${RESET}`);
    console.log(`${CYAN}========================================================================${RESET}`);

    const totalTests = testResults.length;
    const passedTests = testResults.filter(t => t.pass).length;
    const failedTests = testResults.filter(t => !t.pass).length;

    console.log(`Total Scenarios Tested : ${CYAN}${totalTests}${RESET}`);
    console.log(`Passed                 : ${GREEN}${passedTests}${RESET}`);
    console.log(`Failed                 : ${failedTests === 0 ? GREEN : RED}${failedTests}${RESET}`);

    const criticalFails = testResults.filter(t => !t.pass && t.severity === 'CRITICAL').length;
    const highFails = testResults.filter(t => !t.pass && t.severity === 'HIGH').length;
    const medFails = testResults.filter(t => !t.pass && t.severity === 'MEDIUM').length;
    const lowFails = testResults.filter(t => !t.pass && t.severity === 'LOW').length;

    console.log(`\nVulnerabilities Discovered:`);
    console.log(`  CRITICAL : ${criticalFails === 0 ? GREEN : RED}${criticalFails}${RESET}`);
    console.log(`  HIGH     : ${highFails === 0 ? GREEN : RED}${highFails}${RESET}`);
    console.log(`  MEDIUM   : ${medFails === 0 ? GREEN : RED}${medFails}${RESET}`);
    console.log(`  LOW      : ${lowFails === 0 ? GREEN : RED}${lowFails}${RESET}`);

    await teardownFixtures();

    server.close();
    process.exit(failedTests > 0 ? 1 : 0);
}

// Start server on ephemeral port and run tests
server = app.listen(0, async () => {
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Test server running on ${baseUrl}`);
    try {
        await setupFixtures();
        await runPenetrationSuite();
    } catch (err) {
        console.error('Fatal test error:', err);
        await teardownFixtures();
        server.close();
        process.exit(1);
    }
});
