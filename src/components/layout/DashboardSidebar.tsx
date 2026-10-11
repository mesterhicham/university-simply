import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlatformLogo } from '@/components/PlatformLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Calendar, 
  FileText, 
  BarChart3, 
  Award, 
  ClipboardList, 
  Bell, 
  CheckSquare, 
  Download, 
  X, 
  ChevronLeft, 
  Shield, 
  Settings, 
  CalendarDays, 
  Newspaper, 
  Mail, 
  Video, 
  CreditCard, 
  ClipboardCheck, 
  MessageCircle,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTotalUnreadCount } from '@/hooks/useChat';
import { usePWAInstall } from '@/contexts/PWAInstallContext';

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ role, isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { isInstalled, promptInstall } = usePWAInstall();
  const unreadCount = useTotalUnreadCount();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/admin/students', icon: Users, label: t('nav.students') },
    { to: '/admin/teachers', icon: GraduationCap, label: t('nav.teachers') },
    { to: '/admin/formations', icon: BookOpen, label: 'Formations' },
    { to: '/admin/formation-progress', icon: BarChart3, label: 'Student Progress' },
    { to: '/admin/programs', icon: BookOpen, label: t('nav.programs') },
    { to: '/admin/program-pricing', icon: CreditCard, label: 'Program Pricing' },
    { to: '/admin/specialties', icon: Layers, label: t('nav.specialties') },
    { to: '/admin/cohorts', icon: Calendar, label: t('nav.cohorts') },
    { to: '/admin/modules', icon: FileText, label: t('nav.modules') },
    { to: '/admin/diplomas', icon: Award, label: t('nav.diplomas') },
    { to: '/admin/placement-test', icon: ClipboardCheck, label: t('admin.placementTest', 'Placement Test') },
    { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { to: '/admin/news', icon: Newspaper, label: 'News' },
    { to: '/admin/holidays', icon: CalendarDays, label: 'Holidays' },
    { to: '/admin/meetings', icon: Video, label: 'Meetings' },
    { to: '/admin/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/admin/email', icon: Mail, label: 'Email' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
    { to: '/admin/users', icon: Shield, label: t('nav.users') },
    { to: '/admin/reports', icon: BarChart3, label: t('nav.reports') },
  ];

  const teacherLinks = [
    { to: '/teacher', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/teacher/modules', icon: BookOpen, label: t('teacher.myModules') },
    { to: '/teacher/formations', icon: BookOpen, label: 'Formations' },
    { to: '/teacher/formation-progress', icon: BarChart3, label: 'Student Progress' },
    { to: '/teacher/lessons', icon: FileText, label: t('nav.lessons') },
    { to: '/teacher/assignments', icon: ClipboardList, label: t('nav.assignments') },
    { to: '/teacher/attendance', icon: CheckSquare, label: t('nav.attendance') },
    { to: '/teacher/announcements', icon: Bell, label: t('nav.announcements') },
    { to: '/teacher/meetings', icon: Video, label: 'Live Meetings' },
    { to: '/teacher/chat', icon: MessageCircle, label: 'Chat' },
  ];

  const studentLinks = [
    { to: '/student', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/student/courses', icon: BookOpen, label: t('nav.myCourses') },
    { to: '/student/formations', icon: BookOpen, label: 'Formations' },
    { to: '/student/lessons', icon: FileText, label: t('nav.lessons') },
    { to: '/student/assignments', icon: ClipboardList, label: t('nav.assignments') },
    { to: '/student/attendance', icon: CheckSquare, label: t('student.attendanceRecord') },
    { to: '/student/grades', icon: BarChart3, label: t('nav.grades') },
    { to: '/student/diploma', icon: Download, label: t('nav.myDiploma') },
    { to: '/student/meetings', icon: Video, label: 'Live Meetings' },
    { to: '/student/chat', icon: MessageCircle, label: 'Chat' },
  ];

  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden" onClick={onToggle} />
      )}
      
      <aside className={cn(
        "fixed top-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-transform duration-300 lg:translate-x-0 shadow-[0_4px_24px_rgba(0,0,0,0.03)]",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "ltr:left-0 rtl:right-0 rtl:lg:translate-x-0",
        !isOpen && "rtl:translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header with Logo + Theme/Lang quick controls */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex-1 min-w-0">
              <PlatformLogo 
                textClassName="text-base font-bold text-slate-900 dark:text-white truncate" 
                imageClassName="h-8 max-w-[140px] object-contain" 
                iconClassName="h-6 w-6 text-primary"
              />
            </div>

            {/* Quick Actions (Theme + Lang) exactly as in MLM Simply University */}
            <div className="flex items-center gap-1">
              <ThemeToggle className="h-8 w-8 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" />
              <LanguageSwitcher variant="icon" className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" />
              <Button variant="ghost" size="icon" onClick={onToggle} className="lg:hidden h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3.5 py-4 overflow-y-auto space-y-1 scrollbar-thin">
            <ul className="space-y-1">
              {links.map((link) => {
                const isActive = location.pathname === link.to;
                const isChatLink = link.to.endsWith('/chat');
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200",
                        isActive 
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-md shadow-purple-500/25" 
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      )}
                      onClick={() => window.innerWidth < 1024 && onToggle()}
                    >
                      <link.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                      <span className="flex-1 truncate">{link.label}</span>
                      {isChatLink && unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto h-5 min-w-5 justify-center text-xs">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Area: Install App, Back to Home and Log Out pill */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {!isInstalled && (
              <button
                onClick={() => {
                  promptInstall();
                  if (window.innerWidth < 1024) onToggle();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-500/20 transition-all duration-200 active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>{t('common.installApp', 'تثبيت التطبيق')}</span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('common.signOut', 'Log Out')}</span>
            </button>

            <Link 
              to="/" 
              className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors"
            >
              <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
              <span>{t('common.backToHome')}</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
