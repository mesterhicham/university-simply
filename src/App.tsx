import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAProvider } from "@/contexts/PWAInstallContext";
import { InstallModal } from "@/components/pwa/InstallModal";
import { MobileInstallBanner } from "@/components/pwa/MobileInstallBanner";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { SEOHead } from "@/components/SEOHead";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import FormationLanding from "./pages/public/FormationLanding";
import AdminSetup from "./pages/AdminSetup";
import VerifyDiploma from "./pages/VerifyDiploma";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import StudentsManagement from "./pages/admin/StudentsManagement";
import TeachersManagement from "./pages/admin/TeachersManagement";
import ProgramsManagement from "./pages/admin/ProgramsManagement";
import SpecialtiesManagement from "./pages/admin/SpecialtiesManagement";
import CohortsManagement from "./pages/admin/CohortsManagement";
import ModulesManagement from "./pages/admin/ModulesManagement";
import DiplomasManagement from "./pages/admin/DiplomasManagement";
import ReportsPage from "./pages/admin/ReportsPage";
import PlatformSettings from "./pages/admin/PlatformSettings";
import HolidaysManagement from "./pages/admin/HolidaysManagement";
import NewsManagement from "./pages/admin/NewsManagement";
import EmailSettings from "./pages/admin/EmailSettings";
import ZoomMeetings from "./pages/admin/ZoomMeetings";
import PlacementTestManagement from "./pages/admin/PlacementTestManagement";
import PaymentsManagement from "./pages/admin/PaymentsManagement";
import FormationsManagement from "./pages/admin/FormationsManagement";
import ProgramPricing from "./pages/admin/ProgramPricing";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherModules from "./pages/teacher/TeacherModules";
import TeacherLessons from "./pages/teacher/TeacherLessons";
import TeacherAssignments from "./pages/teacher/TeacherAssignments";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncements";
import TeacherMeetingsPage from "./pages/teacher/TeacherMeetingsPage";
import TeacherFormations from "./pages/teacher/TeacherFormations";
import FormationProgressDashboard from "./pages/teacher/FormationProgressDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentCourseDetail from "./pages/student/StudentCourseDetail";
import StudentLessons from "./pages/student/StudentLessons";
import StudentLessonView from "./pages/student/StudentLessonView";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentGrades from "./pages/student/StudentGrades";
import StudentDiploma from "./pages/student/StudentDiploma";
import PlacementTest from "./pages/student/PlacementTest";
import ProgramSelection from "./pages/student/ProgramSelection";
import Payment from "./pages/student/Payment";
import StudentMeetings from "./pages/student/StudentMeetings";
import StudentFormations from "./pages/student/StudentFormations";
import StudentAttendance from "./pages/student/StudentAttendance";
import ChatPage from "./pages/shared/ChatPage";
import MeetingRoom from "./pages/shared/MeetingRoom";
import ProfileSettings from "./pages/shared/ProfileSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SEOHead />
      <PWAProvider>
        <InstallModal />
        <MobileInstallBanner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <ImpersonationBanner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin-setup" element={<AdminSetup />} />
              <Route path="/verify-diploma" element={<VerifyDiploma />} />
              {/* Public Formation Landing Page */}
              <Route path="/formation/:id" element={<FormationLanding />} />
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<StudentsManagement />} />
              <Route path="/admin/teachers" element={<TeachersManagement />} />
              <Route path="/admin/programs" element={<ProgramsManagement />} />
              <Route path="/admin/program-pricing" element={<ProgramPricing />} />
              <Route path="/admin/specialties" element={<SpecialtiesManagement />} />
              <Route path="/admin/cohorts" element={<CohortsManagement />} />
              <Route path="/admin/modules" element={<ModulesManagement />} />
              <Route path="/admin/diplomas" element={<DiplomasManagement />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/settings" element={<PlatformSettings />} />
              <Route path="/admin/holidays" element={<HolidaysManagement />} />
              <Route path="/admin/news" element={<NewsManagement />} />
              <Route path="/admin/email" element={<EmailSettings />} />
              <Route path="/admin/email-settings" element={<EmailSettings />} />
              <Route path="/admin/zoom" element={<ZoomMeetings />} />
              <Route path="/admin/placement-test" element={<PlacementTestManagement />} />
              <Route path="/admin/payments" element={<PaymentsManagement />} />
              <Route path="/admin/formations" element={<FormationsManagement />} />
              <Route path="/admin/users" element={<UsersManagement />} />
              <Route path="/admin/formation-progress" element={<FormationProgressDashboard />} />
              <Route path="/admin/chat" element={<ChatPage />} />
              <Route path="/admin/profile" element={<ProfileSettings />} />
              {/* Teacher Routes */}
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/modules" element={<TeacherModules />} />
              <Route path="/teacher/lessons" element={<TeacherLessons />} />
              <Route path="/teacher/assignments" element={<TeacherAssignments />} />
              <Route path="/teacher/attendance" element={<TeacherAttendance />} />
              <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
              <Route path="/teacher/meetings" element={<TeacherMeetingsPage />} />
              <Route path="/teacher/formations" element={<TeacherFormations />} />
              <Route path="/teacher/formation-progress" element={<FormationProgressDashboard />} />
              <Route path="/teacher/chat" element={<ChatPage />} />
              <Route path="/teacher/profile" element={<ProfileSettings />} />
              {/* Student Routes */}
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/courses" element={<StudentCourses />} />
              <Route path="/student/courses/:courseId" element={<StudentCourseDetail />} />
              <Route path="/student/courses/:moduleId" element={<StudentCourseDetail />} />
              <Route path="/student/formations" element={<StudentFormations />} />
              <Route path="/student/lessons" element={<StudentLessons />} />
              <Route path="/student/lessons/:lessonId" element={<StudentLessonView />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/attendance" element={<StudentAttendance />} />
              <Route path="/student/grades" element={<StudentGrades />} />
              <Route path="/student/diploma" element={<StudentDiploma />} />
              <Route path="/student/placement-test" element={<PlacementTest />} />
              <Route path="/student/program-selection" element={<ProgramSelection />} />
              <Route path="/student/payment" element={<Payment />} />
              <Route path="/student/meetings" element={<StudentMeetings />} />
              <Route path="/student/chat" element={<ChatPage />} />
              <Route path="/student/profile" element={<ProfileSettings />} />
              {/* Shared Routes */}
              <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </PWAProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
