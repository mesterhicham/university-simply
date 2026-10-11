import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { AIAssistant } from '@/components/dashboard/AIAssistant';
import { useAdminStats } from '@/hooks/useDashboardData';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  CreditCard, 
  Layers, 
  Award, 
  Video, 
  FileText, 
  Bell, 
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const stats = useAdminStats();

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <PageHeader 
        title={t('admin.title')}
        description={t('admin.welcome')}
        breadcrumbs={[{ label: t('nav.dashboard') }]}
        icon={LayoutDashboard}
      />

      {/* 4 Primary KPI Stat Cards Matching MLM Simply University */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard 
          title={t('admin.totalStudents')} 
          value={stats.isLoading ? '...' : stats.totalStudents} 
          icon={Users} 
          variant="purple"
          trend={{ 
            value: Number(stats.activeStudents) || 0, 
            isPositive: true 
          }}
        />

        <StatCard 
          title={t('admin.totalTeachers')} 
          value={stats.isLoading ? '...' : stats.totalTeachers} 
          icon={GraduationCap} 
          variant="emerald" 
        />

        <StatCard 
          title={t('nav.programs', 'البرامج والدفعات')} 
          value={stats.isLoading ? '...' : `${stats.totalPrograms} / ${stats.totalCohorts}`} 
          icon={BookOpen} 
          variant="sky" 
        />

        <StatCard 
          title={t('nav.reports', 'الإيرادات المؤكدة')} 
          value={stats.isLoading ? '...' : `${Number(stats.revenue).toLocaleString()} MAD`} 
          icon={CreditCard} 
          variant="amber" 
        />
      </div>

      {/* Analytics Chart: Student Enrollment Growth */}
      <Card className="mb-8 rounded-3xl border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>{isRtl ? 'نمو تسجيلات الطلاب' : 'Student Enrollment Growth'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5">
              {isRtl ? 'معدل التسجيل الشهري للطلاب خلال الفترة الأخيرة' : 'Student registrations trend over recent months'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-medium rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            {stats.isLoading ? '...' : `${stats.activeStudents} ${isRtl ? 'طالب نشط' : 'Active Students'}`}
          </Badge>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72 w-full">
            {stats.isLoading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyEnrollments} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '1rem',
                      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08)'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name={isRtl ? 'الطلاب' : 'Students'} 
                    stroke="#7c3aed" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorStudents)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Platform Modules Navigation Hub */}
      <Card className="mb-8 rounded-3xl border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
            <Layers className="h-5 w-5 text-primary" />
            <span>{isRtl ? 'الوحدات الإدارية السريعة' : 'Quick Management Hub'}</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            {isRtl ? 'الوصول السريع إلى الأقسام والخدمات الأساسية للمنصة' : 'Direct shortcuts to platform core modules and services'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <Link to="/admin/users" className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 mb-2.5 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{isRtl ? 'المستخدمين والأدوار' : 'Users & Roles'}</span>
            </Link>

            <Link to="/admin/formations" className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 mb-2.5 group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{isRtl ? 'التكوينات والدورات' : 'Formations'}</span>
            </Link>

            <Link to="/admin/diplomas" className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 mb-2.5 group-hover:scale-110 transition-transform">
                <Award className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{isRtl ? 'إدارة الشهادات' : 'Diplomas'}</span>
            </Link>

            <Link to="/admin/meetings" className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 mb-2.5 group-hover:scale-110 transition-transform">
                <Video className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{isRtl ? 'غرف زووم الافتراضية' : 'Zoom Meetings'}</span>
            </Link>

            <Link to="/admin/placement-test" className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 mb-2.5 group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{isRtl ? 'اختبارات تحديد المستوى' : 'Placement Tests'}</span>
            </Link>

            <Link to="/admin/news" className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 mb-2.5 group-hover:scale-110 transition-transform">
                <Bell className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{isRtl ? 'الأخبار والإعلانات' : 'News & Alerts'}</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Secondary KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('admin.activeStudents')}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.isLoading ? '...' : stats.activeStudents}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('admin.graduated', 'الخريجون')}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.isLoading ? '...' : stats.graduatedStudents}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 rounded-2xl shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRtl ? 'المقررات الدراسية' : 'Total Modules'}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.isLoading ? '...' : stats.totalModules}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{isRtl ? 'التكوينات المتاحة' : 'Formations'}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.isLoading ? '...' : stats.totalFormations}
            </p>
          </div>
        </div>
      </div>

      {/* Embedded AI Assistant for Admin */}
      <AIAssistant role="admin" />
    </DashboardLayout>
  );
}
