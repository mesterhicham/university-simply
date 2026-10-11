import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { AIAssistant } from '@/components/dashboard/AIAssistant';
import { useStudentModules, useStudentStats, useCurrentStudent } from '@/hooks/useDashboardData';
import { useStudentEnrollmentStatus } from '@/hooks/usePaymentFlow';
import { useNews, useZoomMeetings, useHolidays } from '@/hooks/useAdminFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  ClipboardList, 
  Award, 
  TrendingUp, 
  Loader2, 
  Newspaper, 
  Bell, 
  Calendar,
  Video,
  Clock,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isAfter, isBefore, addDays } from 'date-fns';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const stats = useStudentStats();
  const { data: student, isLoading: studentLoading } = useCurrentStudent();
  const { data: modules, isLoading: modulesLoading } = useStudentModules();
  const { data: enrollmentStatus, isLoading: enrollmentLoading } = useStudentEnrollmentStatus();
  const { data: news, isLoading: newsLoading } = useNews('students');
  const { data: meetings, isLoading: meetingsLoading } = useZoomMeetings();
  const { data: holidays, isLoading: holidaysLoading } = useHolidays();

  // Redirect based on enrollment status
  useEffect(() => {
    if (enrollmentLoading || !enrollmentStatus) return;
    
    // If student hasn't completed placement test or selected program
    if (!enrollmentStatus.hasCompletedTest) {
      if (enrollmentStatus.isPlacementTestEnabled) {
        navigate('/student/placement-test');
      } else {
        navigate('/student/program-selection');
      }
      return;
    }
    
    // If student hasn't paid (no approved payment), redirect to payment
    if (!enrollmentStatus.hasApprovedPayment) {
      navigate('/student/payment');
      return;
    }
  }, [enrollmentStatus, enrollmentLoading, navigate]);

  // Show loading while checking enrollment status
  if (enrollmentLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Don't render dashboard if student needs to complete enrollment flow
  if (enrollmentStatus && (!enrollmentStatus.hasCompletedTest || !enrollmentStatus.hasApprovedPayment)) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Filter upcoming meetings (next 7 days)
  const upcomingMeetings = meetings?.filter(m => {
    const meetingDate = new Date(m.scheduled_at);
    const now = new Date();
    return isAfter(meetingDate, now) && isBefore(meetingDate, addDays(now, 7));
  }).slice(0, 5) || [];

  // Filter upcoming holidays
  const upcomingHolidays = holidays?.filter(h => {
    const startDate = new Date(h.start_date);
    return isAfter(startDate, new Date()) || isAfter(new Date(h.end_date), new Date());
  }).slice(0, 3) || [];

  // Get recent news (last 5)
  const recentNews = news?.slice(0, 5) || [];

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return Bell;
      case 'exam': return Award;
      case 'schedule': return Calendar;
      default: return Newspaper;
    }
  };

  return (
    <DashboardLayout role="student">
      <PageHeader 
        title={t('student.title')} 
        description={t('student.welcome')} 
        breadcrumbs={[{ label: t('nav.dashboard') }]} 
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title={t('student.enrolledCourses')} 
          value={stats.isLoading ? '...' : stats.enrolledCourses} 
          icon={BookOpen} 
          variant="primary" 
        />
        <StatCard 
          title={t('student.pendingAssignments')} 
          value={stats.isLoading ? '...' : stats.pendingAssignments} 
          icon={ClipboardList} 
          variant="warning" 
        />
        <StatCard 
          title={t('student.averageGrade')} 
          value={stats.isLoading ? '...' : `${stats.averageGrade}%`} 
          icon={Award} 
          variant="success" 
        />
        <StatCard 
          title={t('student.attendanceRate')} 
          value={stats.isLoading ? '...' : `${stats.attendanceRate}%`} 
          icon={TrendingUp} 
          variant="accent" 
        />
      </div>

      {/* News & Announcements Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Newspaper className="h-5 w-5 text-primary" />
              News & Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {newsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 bg-secondary/30 rounded-lg">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : recentNews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Newspaper className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No announcements at this time</p>
              </div>
            ) : (
              recentNews.map((item) => {
                const TypeIcon = getTypeIcon(item.type);
                return (
                  <div key={item.id} className="p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-sm">{item.title}</h4>
                      </div>
                      <Badge variant={getPriorityColor(item.priority) as any} className="text-xs">
                        {item.priority || 'info'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {item.content}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {format(new Date(item.published_at || item.created_at || ''), 'PPP')}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meetingsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 bg-secondary/30 rounded-lg">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : upcomingMeetings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No upcoming classes this week</p>
              </div>
            ) : (
              upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="h-4 w-4 text-blue-500" />
                        <h4 className="font-medium text-sm">{meeting.title}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(meeting.scheduled_at), 'EEE, MMM d')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(meeting.scheduled_at), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                    {meeting.meeting_url && (
                      <a 
                        href={meeting.meeting_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Join
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Holidays Section */}
            {upcomingHolidays.length > 0 && (
              <div className="pt-3 border-t border-border mt-3">
                <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Upcoming Holidays
                </h5>
                {upcomingHolidays.map((holiday) => (
                  <div key={holiday.id} className="p-2 bg-accent/30 rounded-lg mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{holiday.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(holiday.start_date), 'MMM d')}
                        {holiday.start_date !== holiday.end_date && (
                          <> - {format(new Date(holiday.end_date), 'MMM d')}</>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 table-container">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">{t('student.myModules')}</h3>
          </div>
          <div className="p-4 space-y-3">
            {modulesLoading || studentLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : !modules || modules.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {!student?.cohort_id 
                  ? t('student.notEnrolled')
                  : t('common.noData')
                }
              </p>
            ) : (
              modules.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {m.teacher?.full_name || t('common.noTeacher')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="table-container">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">{t('student.myInfo')}</h3>
          </div>
          <div className="p-4 space-y-3">
            {studentLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : !student ? (
              <p className="text-center text-muted-foreground py-4">
                {t('student.noStudentRecord')}
              </p>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t('table.program')}</p>
                  <p className="font-medium text-foreground">
                    {student.cohort?.specialty?.program?.name || '-'}
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t('table.specialty')}</p>
                  <p className="font-medium text-foreground">
                    {student.cohort?.specialty?.name || '-'}
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t('table.cohort')}</p>
                  <p className="font-medium text-foreground">
                    {student.cohort?.name || '-'}
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t('table.enrollmentDate')}</p>
                  <p className="font-medium text-foreground">
                    {student.enrollment_date || '-'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AIAssistant role="student" />
    </DashboardLayout>
  );
}
