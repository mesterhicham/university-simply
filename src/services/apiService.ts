import api from '@/lib/api';

export const authService = {
    checkAdminExists: () => api.get('/auth/check-admin').then(res => res.data),
    setupFirstAdmin: () => api.post('/auth/setup-admin').then(res => res.data),
    sendWhatsAppOtp: (phoneNumber: string) => api.post('/auth/whatsapp/send-otp', { phone_number: phoneNumber }).then(res => res.data),
    verifyWhatsAppOtp: (phoneNumber: string, code: string) => api.post('/auth/whatsapp/verify-otp', { phone_number: phoneNumber, code }).then(res => res.data),
};

export const userService = {
    getProfile: () => api.get('/user/profile').then(res => res.data),
    updateProfile: (data: any) => api.put('/user/profile', data).then(res => res.data),
    deleteAccount: (password: string) => api.delete('/user/account', { data: { password } }).then(res => res.data),
    changePassword: (data: any) => api.post('/user/change-password', data).then(res => res.data),
    getStats: (role: string) => api.get(`/user/stats/${role}`).then(res => res.data),
    getAdminStats: () => api.get('/user/stats/admin').then(res => res.data),
};

export const academicService = {
    getPrograms: () => api.get('/academic/programs').then(res => res.data),
    getProgram: (id: string) => api.get(`/academic/programs/${id}`).then(res => res.data),
    createProgram: (data: any) => api.post('/academic/programs', data).then(res => res.data),
    updateProgram: ({ id, ...data }: any) => api.put(`/academic/programs/${id}`, data).then(res => res.data),
    deleteProgram: (id: string) => api.delete(`/academic/programs/${id}`).then(res => res.data),

    getSpecialties: () => api.get('/academic/specialties').then(res => res.data),
    createSpecialty: (data: any) => api.post('/academic/specialties', data).then(res => res.data),
    updateSpecialty: ({ id, ...data }: any) => api.put(`/academic/specialties/${id}`, data).then(res => res.data),
    deleteSpecialty: (id: string) => api.delete(`/academic/specialties/${id}`).then(res => res.data),

    getCohorts: () => api.get('/academic/cohorts').then(res => res.data),
    createCohort: (data: any) => api.post('/academic/cohorts', data).then(res => res.data),
    updateCohort: ({ id, ...data }: any) => api.put(`/academic/cohorts/${id}`, data).then(res => res.data),
    deleteCohort: (id: string) => api.delete(`/academic/cohorts/${id}`).then(res => res.data),

    getModules: () => api.get('/academic/modules').then(res => res.data),
    getModule: (id: string) => api.get(`/academic/modules/${id}`).then(res => res.data),
    createModule: (data: any) => api.post('/academic/modules', data).then(res => res.data),
    updateModule: ({ id, ...data }: any) => api.put(`/academic/modules/${id}`, data).then(res => res.data),
    deleteModule: (id: string) => api.delete(`/academic/modules/${id}`).then(res => res.data),

    getTeachers: () => api.get('/academic/teachers').then(res => res.data),
    getTeacherDetails: (id: string) => api.get(`/academic/teachers/${id}/details`).then(res => res.data),
    createTeacher: (data: any) => api.post('/academic/teachers', data).then(res => res.data),
    updateTeacher: ({ id, ...data }: any) => api.put(`/academic/teachers/${id}`, data).then(res => res.data),
    deleteTeacher: (id: string) => api.delete(`/academic/teachers/${id}`).then(res => res.data),
    getStudents: () => api.get('/academic/students').then(res => res.data),
    getStudentDetails: (id: string) => api.get(`/academic/students/${id}/details`).then(res => res.data),
    createStudent: (data: any) => api.post('/academic/students', data).then(res => res.data),
    updateStudent: ({ id, ...data }: any) => api.put(`/academic/students/${id}`, data).then(res => res.data),
    deleteStudent: (id: string) => api.delete(`/academic/students/${id}`).then(res => res.data),
    impersonateStudent: (id: string) => api.post(`/academic/students/${id}/impersonate`).then(res => res.data),
    addStudentPayment: ({ id, ...data }: any) => api.post(`/academic/students/${id}/payments`, data).then(res => res.data),
};

export const uploadService = {
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data);
    }
};

export const teacherService = {
    getLessons: () => api.get('/teacher/lessons').then(res => res.data),
    createLesson: (data: any) => api.post('/teacher/lessons', data).then(res => res.data),
    updateLesson: ({ id, ...data }: any) => api.put(`/teacher/lessons/${id}`, data).then(res => res.data),
    deleteLesson: (id: string) => api.delete(`/teacher/lessons/${id}`).then(res => res.data),
    getAttendance: (lessonId: string) => api.get(`/teacher/attendance/${lessonId}`).then(res => res.data),
    markAttendance: (data: any) => api.post('/teacher/attendance', data).then(res => res.data),
    getAssignments: () => api.get('/teacher/assignments').then(res => res.data),
    createAssignment: (data: any) => api.post('/teacher/assignments', data).then(res => res.data),
    updateAssignment: ({ id, ...data }: any) => api.put(`/teacher/assignments/${id}`, data).then(res => res.data),
    deleteAssignment: (id: string) => api.delete(`/teacher/assignments/${id}`).then(res => res.data),
    getAssignmentSubmissions: (assignmentId: string) => api.get(`/teacher/assignments/${assignmentId}/submissions`).then(res => res.data),
    gradeSubmission: (data: any) => api.post('/teacher/assignments/grade', data).then(res => res.data),

    // Lesson Content
    getLessonContent: (lessonId: string) => api.get(`/teacher/lessons/${lessonId}/content`).then(res => res.data),
    uploadLessonContent: (data: any) => api.post('/teacher/lessons/content', data).then(res => res.data),
    deleteLessonContent: (id: string) => api.delete(`/teacher/lessons/content/${id}`).then(res => res.data),
    reorderLessonContent: (items: any[]) => api.post('/teacher/lessons/content/reorder', { items }).then(res => res.data),

    // Teacher Announcements
    getAnnouncements: () => api.get('/teacher/announcements').then(res => res.data),
    createAnnouncement: (data: any) => api.post('/teacher/announcements', data).then(res => res.data),
    updateAnnouncement: ({ id, ...data }: any) => api.put(`/teacher/announcements/${id}`, data).then(res => res.data),
    deleteAnnouncement: (id: string) => api.delete(`/teacher/announcements/${id}`).then(res => res.data),

    // Formation Progress
    getFormationProgress: () => api.get('/teacher/formation-progress').then(res => res.data),
};

export const studentService = {
    getRecord: () => api.get('/student/record').then(res => res.data),
    getLessons: () => api.get('/student/lessons').then(res => res.data),
    getAssignments: () => api.get('/student/assignments').then(res => res.data),
    getMySubmissions: () => api.get('/student/my-submissions').then(res => res.data),
    submitAssignment: (data: any) => api.post('/student/submit-assignment', data).then(res => res.data),
    getLessonProgress: (lessonId: string) => api.get(`/student/lessons/${lessonId}/progress`).then(res => res.data),
    updateLessonProgress: (data: any) => api.post('/student/lessons/progress', data).then(res => res.data),
    getAttendance: () => api.get('/student/attendance').then(res => res.data),
    selectProgram: (data: { programId: string; specialtyId?: string }) => api.post('/student/select-program', data).then(res => res.data),
};

export const adminService = {
    getSettings: () => api.get('/admin/settings').then(res => res.data),
    updateSetting: (data: any) => api.post('/admin/settings', data).then(res => res.data),
    getHolidays: () => api.get('/admin/holidays').then(res => res.data),
    createHoliday: (data: any) => api.post('/admin/holidays', data).then(res => res.data),
    updateHoliday: ({ id, ...data }: any) => api.put(`/admin/holidays/${id}`, data).then(res => res.data),
    deleteHoliday: (id: string) => api.delete(`/admin/holidays/${id}`).then(res => res.data),
    getNews: () => api.get('/admin/news').then(res => res.data),
    createNews: (data: any) => api.post('/admin/news', data).then(res => res.data),
    updateNews: ({ id, ...data }: any) => api.put(`/admin/news/${id}`, data).then(res => res.data),
    deleteNews: (id: string) => api.delete(`/admin/news/${id}`).then(res => res.data),

    // Users Management
    getAllUsers: () => api.get('/admin/users').then(res => res.data),
    updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }).then(res => res.data),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then(res => res.data),

    // Payment Account Settings
    getPaymentAccountSettings: () => api.get('/admin/payment-settings').then(res => res.data),
    savePaymentAccountSettings: (settings: any) => api.post('/admin/payment-settings', settings).then(res => res.data),

    // Email Settings
    getEmailSettings: () => api.get('/admin/email/settings').then(res => res.data),
    saveEmailSettings: (data: any) => api.post('/admin/email/settings', data).then(res => res.data),
    getEmailTemplates: () => api.get('/admin/email/templates').then(res => res.data),
    updateEmailTemplate: ({ id, ...data }: any) => api.put(`/admin/email/templates/${id}`, data).then(res => res.data),
    getEmailLogs: () => api.get('/admin/email/logs').then(res => res.data),
    sendTestEmail: (data: { recipient_email: string }) => api.post('/admin/email/test', data).then(res => res.data),

    // Zoom Meetings
    getZoomMeetings: () => api.get('/admin/zoom/meetings').then(res => res.data),
    getTeacherMeetings: () => api.get('/admin/zoom/teacher-meetings').then(res => res.data),
    getStudentMeetings: () => api.get('/admin/zoom/student-meetings').then(res => res.data),
    createZoomMeeting: (data: any) => api.post('/admin/zoom/meetings', data).then(res => res.data),
    updateZoomMeeting: ({ id, ...data }: any) => api.put(`/admin/zoom/meetings/${id}`, data).then(res => res.data),
    deleteZoomMeeting: (id: string) => api.delete(`/admin/zoom/meetings/${id}`).then(res => res.data),
    toggleRoomOpen: (id: string, room_open: boolean) => api.post(`/admin/zoom/meetings/${id}/open`, { room_open }).then(res => res.data),
    getMeetingAttendance: (meetingId: string) => api.get(`/admin/zoom/meetings/${meetingId}/attendance`).then(res => res.data),
    updateMeetingAttendance: (data: any) => api.post('/admin/zoom/meetings/attendance', data).then(res => res.data),
};

export const paymentService = {
    getPricing: () => api.get('/payment/pricing').then(res => res.data),
    upsertPricing: (data: any) => api.post('/payment/pricing', data).then(res => res.data),
    getStudentPayments: () => api.get('/payment/student-payments').then(res => res.data),
    getAllPayments: () => api.get('/payment/all-payments').then(res => res.data),
    submitPayment: (data: any) => api.post('/payment/submit', data).then(res => res.data),
    updateStatus: ({ id, ...data }: any) => api.put(`/payment/${id}/status`, data).then(res => res.data),
};

export const testService = {
    getStatus: (): Promise<{ isEnabled: boolean }> => api.get('/test/status').then(res => res.data),
    updateStatus: (isEnabled: boolean): Promise<{ success: boolean; isEnabled: boolean }> => api.post('/test/status', { isEnabled }).then(res => res.data),
    getQuestions: () => api.get('/test/questions').then(res => res.data),
    getAllQuestions: () => api.get('/test/all-questions').then(res => res.data),
    getStudentTestResult: () => api.get('/test/result').then(res => res.data),
    createQuestion: (data: any) => api.post('/test/questions', data).then(res => res.data),
    updateQuestion: ({ id, ...data }: any) => api.put(`/test/questions/${id}`, data).then(res => res.data),
    deleteQuestion: (id: string) => api.delete(`/test/questions/${id}`).then(res => res.data),
    submitTest: (data: any) => api.post('/test/submit', data).then(res => res.data),
    getAllResults: () => api.get('/test/all-results').then(res => res.data),
    seedSampleQuestions: () => api.post('/test/seed-samples').then(res => res.data),
};

export const formationService = {
    getFormations: () => api.get('/formation').then(res => res.data),
    getPublishedFormations: () => api.get('/formation/published').then(res => res.data),
    getFormation: (id: string) => api.get(`/formation/${id}`).then(res => res.data),
    createFormation: (data: any) => api.post('/formation', data).then(res => res.data),
    updateFormation: ({ id, ...data }: any) => api.put(`/formation/${id}`, data).then(res => res.data),
    deleteFormation: (id: string) => api.delete(`/formation/${id}`).then(res => res.data),

    getFormationContent: (formationId: string) => api.get(`/formation/${formationId}/content`).then(res => res.data),
    addFormationContent: (data: any) => api.post('/formation/content', data).then(res => res.data),
    updateFormationContent: ({ id, ...data }: any) => api.put(`/formation/content/${id}`, data).then(res => res.data),
    deleteFormationContent: (id: string) => api.delete(`/formation/content/${id}`).then(res => res.data),
    reorderFormationContent: (items: any[]) => api.post('/formation/content/reorder', { items }).then(res => res.data),

    getAllEnrollments: () => api.get('/formation/enrollments/all').then(res => res.data),
    getStudentEnrollments: () => api.get('/formation/enrollments/mine').then(res => res.data),
    updateEnrollmentStatus: ({ id, status }: any) => api.put(`/formation/enrollments/${id}/status`, { status }).then(res => res.data),

    getAllPayments: () => api.get('/formation/payments/all').then(res => res.data),
    updatePaymentStatus: ({ id, ...data }: any) => api.put(`/formation/payments/${id}/status`, data).then(res => res.data),

    getRevenueStats: () => api.get('/formation/stats/revenue').then(res => res.data),
    
    // Student Progress & Payments
    getStudentProgress: (enrollmentId: string) => api.get(`/formation/progress/${enrollmentId}`).then(res => res.data),
    updateStudentProgress: (data: any) => api.post('/formation/progress', data).then(res => res.data),
    submitPayment: (data: any) => api.post('/formation/enroll', data).then(res => res.data),
};

export const chatService = {
    getConversations: () => api.get('/chat/conversations').then(res => res.data),
    getOrCreateDirect: (other_user_id: string) => api.post('/chat/conversations/direct', { other_user_id }).then(res => res.data),
    getOrCreateCohort: (cohort_id: string, name?: string) => api.post('/chat/conversations/cohort', { cohort_id, name }).then(res => res.data),
    getMessages: (conversationId: string) => api.get(`/chat/conversations/${conversationId}/messages`).then(res => res.data),
    sendMessage: (conversationId: string, data: any) => api.post(`/chat/conversations/${conversationId}/messages`, data).then(res => res.data),
    markAsRead: (conversationId: string) => api.post(`/chat/conversations/${conversationId}/read`).then(res => res.data),
    toggleReaction: (messageId: string, emoji: string) => api.post(`/chat/messages/${messageId}/reactions`, { emoji }).then(res => res.data),
    setTyping: (conversationId: string, isTyping: boolean) => api.post(`/chat/conversations/${conversationId}/typing`, { isTyping }).then(res => res.data),
    getTyping: (conversationId: string) => api.get(`/chat/conversations/${conversationId}/typing`).then(res => res.data),
};
