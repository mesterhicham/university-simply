import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTeacherDetails } from '@/hooks/useDashboardData';
import { useUpdateTeacher } from '@/hooks/useEntityMutations';
import { uploadService } from '@/services/apiService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { COUNTRIES } from '@/data/countries';
import { toast } from 'sonner';
import {
  GraduationCap,
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Plus,
  Trash2,
  Upload,
  ExternalLink,
  BarChart3,
  Loader2,
  Briefcase,
  Layers,
  Sparkles,
  ShieldCheck,
  User
} from 'lucide-react';

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  issue_date?: string;
  file_url?: string;
  description?: string;
}

interface TeacherDetailModalProps {
  teacherId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherDetailModal({ teacherId, open, onOpenChange }: TeacherDetailModalProps) {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useTeacherDetails(teacherId);
  const updateTeacher = useUpdateTeacher();

  const [activeTab, setActiveTab] = useState('overview');

  // Edit form state
  const [formData, setFormData] = useState({
    fullName: '',
    specialty: '',
    degree: '',
    status: 'active',
    phone: '',
    whatsappNumber: '',
    city: '',
    country: '',
    hire_date: '',
    experience: '',
    bio: '',
  });

  // Certifications list state
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [newCert, setNewCert] = useState<Partial<CertificationItem>>({
    title: '',
    issuer: '',
    issue_date: '',
    file_url: '',
    description: '',
  });
  const [isUploadingCert, setIsUploadingCert] = useState(false);

  // Sync data into local form state
  useEffect(() => {
    if (data?.teacher) {
      const teach = data.teacher;
      const prof = teach.profile || {};
      setFormData({
        fullName: prof.full_name || teach.full_name || '',
        specialty: teach.specialty || '',
        degree: teach.degree || '',
        status: teach.status || 'active',
        phone: prof.phone || '',
        whatsappNumber: prof.whatsapp_number || '',
        city: prof.city || '',
        country: prof.country || '',
        hire_date: teach.hire_date ? teach.hire_date.substring(0, 10) : '',
        experience: teach.experience || '',
        bio: teach.bio || prof.bio || '',
      });

      // Certifications
      if (Array.isArray(data.certifications)) {
        setCertifications(data.certifications);
      } else if (typeof data.certifications === 'string') {
        try {
          setCertifications(JSON.parse(data.certifications));
        } catch {
          setCertifications([]);
        }
      } else {
        setCertifications([]);
      }
    }
  }, [data]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;

    try {
      await updateTeacher.mutateAsync({
        id: teacherId,
        fullName: formData.fullName.trim(),
        specialty: formData.specialty.trim() || null,
        degree: formData.degree.trim() || null,
        status: formData.status,
        phone: formData.phone.trim() || null,
        whatsappNumber: formData.whatsappNumber.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country || null,
        hire_date: formData.hire_date || null,
        experience: formData.experience.trim() || null,
        bio: formData.bio.trim() || null,
        certifications,
      });
      refetch();
    } catch {
      // Handled by mutation hook toast
    }
  };

  const handleUploadCertFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCert(true);
      const res = await uploadService.uploadFile(file);
      const fileUrl = res.url || res.fileUrl || res.path;
      setNewCert((prev) => ({ ...prev, file_url: fileUrl }));
      toast.success('تم رفع وثيقة الشهادة بنجاح');
    } catch (err: any) {
      toast.error('فشل رفع الملف: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsUploadingCert(false);
    }
  };

  const handleAddCert = async () => {
    if (!newCert.title?.trim() || !newCert.issuer?.trim()) {
      toast.error('يرجى ملء عنوان الشهادة والجهة المانحة');
      return;
    }

    const item: CertificationItem = {
      id: crypto.randomUUID(),
      title: newCert.title.trim(),
      issuer: newCert.issuer.trim(),
      issue_date: newCert.issue_date || '',
      file_url: newCert.file_url || '',
      description: newCert.description?.trim() || '',
    };

    const updated = [...certifications, item];
    setCertifications(updated);
    setIsAddingCert(false);
    setNewCert({ title: '', issuer: '', issue_date: '', file_url: '', description: '' });

    if (teacherId) {
      try {
        await updateTeacher.mutateAsync({
          id: teacherId,
          certifications: updated,
        });
        refetch();
      } catch {
        // Handled
      }
    }
  };

  const handleDeleteCert = async (certId: string) => {
    const updated = certifications.filter((c) => c.id !== certId);
    setCertifications(updated);

    if (teacherId) {
      try {
        await updateTeacher.mutateAsync({
          id: teacherId,
          certifications: updated,
        });
        refetch();
        toast.success('تم حذف الشهادة بنجاح');
      } catch {
        // Handled
      }
    }
  };

  const teacher = data?.teacher;
  const stats = data?.stats || {
    totalStudents: 0,
    totalModules: 0,
    totalLessons: 0,
    totalAssignments: 0,
    attendanceRate: 100,
    submissionRate: 100,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    totalAttendanceRecords: 0,
  };
  const modules = data?.modules || [];
  const lessons = data?.lessons || [];
  const assignments = data?.assignments || [];
  const students = data?.students || [];

  const displayName = teacher?.profile?.full_name || teacher?.full_name || 'الأستاذ';
  const displayEmail = teacher?.profile?.email || teacher?.email || '';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 border-slate-100 dark:border-slate-800 text-right rtl">
        <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 text-right">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-purple-500/20 shrink-0">
                {initials}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{displayName}</span>
                  <StatusBadge
                    status={t(`status.${formData.status || 'active'}`)}
                    variant={getStatusVariant(formData.status || 'active')}
                  />
                </DialogTitle>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {displayEmail}
                  </span>
                  {teacher?.specialty && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                      {teacher.specialty}
                    </span>
                  )}
                  {teacher?.degree && (
                    <Badge variant="secondary" className="text-[11px] rounded-lg">
                      {teacher.degree}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick KPI pills */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3.5 py-2 text-center">
                <span className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold block">نسبة الحضور</span>
                <span className="text-sm font-bold text-purple-700 dark:text-purple-200">{stats.attendanceRate}%</span>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl px-3.5 py-2 text-center">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-semibold block">إجمالي الطلاب</span>
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-200">{stats.totalStudents}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-sm">جاري تحميل الملف الشامل للمدرس...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-5 w-full bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6">
              <TabsTrigger value="overview" className="rounded-xl text-xs font-semibold">
                <BarChart3 className="w-3.5 h-3.5 ml-1.5" />
                <span>نظرة عامة</span>
              </TabsTrigger>
              <TabsTrigger value="edit" className="rounded-xl text-xs font-semibold">
                <Edit3 className="w-3.5 h-3.5 ml-1.5" />
                <span>تعديل الحساب</span>
              </TabsTrigger>
              <TabsTrigger value="certifications" className="rounded-xl text-xs font-semibold">
                <Award className="w-3.5 h-3.5 ml-1.5" />
                <span>الشواهد ({certifications.length})</span>
              </TabsTrigger>
              <TabsTrigger value="modules" className="rounded-xl text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5 ml-1.5" />
                <span>المقررات ({modules.length})</span>
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-xl text-xs font-semibold">
                <Users className="w-3.5 h-3.5 ml-1.5" />
                <span>الطلاب والتقدم</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW & STATS */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-950/40 dark:to-purple-950/40 p-4 rounded-3xl border border-purple-100 dark:border-purple-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">إجمالي الطلاب</span>
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalStudents}</div>
                  <p className="text-[11px] text-slate-400 mt-1">متابعون في الأفواج المسندة</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">نسبة الحضور</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.attendanceRate}%</div>
                  <Progress value={stats.attendanceRate} className="h-1.5 mt-2 bg-emerald-100 dark:bg-emerald-950" />
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-950/40 dark:to-cyan-950/40 p-4 rounded-3xl border border-blue-100 dark:border-blue-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">المقررات والدروس</span>
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalModules}</div>
                  <p className="text-[11px] text-slate-400 mt-1">{stats.totalLessons} درس تم إنجازه</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-950/40 dark:to-orange-950/40 p-4 rounded-3xl border border-amber-100 dark:border-amber-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">تسليم المهام</span>
                    <FileText className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.submissionRate}%</div>
                  <p className="text-[11px] text-slate-400 mt-1">{stats.totalAssignments} واجب مطروح</p>
                </div>
              </div>

              {/* Detailed Attendance breakdown & Info */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Attendance detailed card */}
                <div className="bg-card p-5 rounded-3xl border border-border shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>تحليل الحضور والغياب مع الطلاب</span>
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-border/50">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        حاضر (Present)
                      </span>
                      <span className="font-bold text-foreground">{stats.presentCount} طالب</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/50">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        غائب (Absent)
                      </span>
                      <span className="font-bold text-foreground">{stats.absentCount} طالب</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/50">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        متأخر (Late)
                      </span>
                      <span className="font-bold text-foreground">{stats.lateCount} طالب</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-semibold text-foreground">إجمالي سجلات الحضور:</span>
                      <span className="font-bold text-foreground">{stats.totalAttendanceRecords} سجل</span>
                    </div>
                  </div>
                </div>

                {/* Teacher Bio & Academic Profile */}
                <div className="bg-card p-5 rounded-3xl border border-border shadow-xs space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span>البطاقة الأكاديمية والمهنية</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">التخصص:</span>
                      <span className="font-semibold text-foreground">{teacher?.specialty || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الدرجة العلمية:</span>
                      <span className="font-semibold text-foreground">{teacher?.degree || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">تاريخ التعيين:</span>
                      <span className="font-semibold text-foreground">{teacher?.hire_date || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">الهاتف / الواتساب:</span>
                      <span className="font-semibold text-foreground" dir="ltr">{teacher?.profile?.phone || teacher?.profile?.whatsapp_number || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">المدينة / الدولة:</span>
                      <span className="font-semibold text-foreground">{teacher?.profile?.city ? `${teacher.profile.city}, ` : ''}{teacher?.profile?.country || '-'}</span>
                    </div>
                  </div>
                  {teacher?.experience && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-1">الخبرة:</span>
                      <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-xl">{teacher.experience}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: EDIT ACCOUNT */}
            <TabsContent value="edit">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">الاسم الكامل *</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      placeholder="اسم المدرس"
                      className="rounded-xl"
                    />
                  </div>

                  {/* Specialty */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">التخصص الأكاديمي</Label>
                    <Input
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="مثال: هندسة البرمجيات، علوم الحاسوب"
                      className="rounded-xl"
                    />
                  </div>

                  {/* Degree */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">الدرجة العلمية / المؤهل</Label>
                    <Select
                      value={formData.degree}
                      onValueChange={(val) => setFormData({ ...formData, degree: val })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="اختر الدرجة العلمية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="دكتوراه (PhD)">دكتوراه (PhD)</SelectItem>
                        <SelectItem value="ماجستير (Master)">ماجستير (Master)</SelectItem>
                        <SelectItem value="مهندس دولة (State Engineer)">مهندس دولة (State Engineer)</SelectItem>
                        <SelectItem value="إجازة / بكالوريوس (Bachelor)">إجازة / بكالوريوس (Bachelor)</SelectItem>
                        <SelectItem value="خبير معتمد (Certified Expert)">خبير معتمد (Certified Expert)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">حالة الحساب</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val) => setFormData({ ...formData, status: val })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('status.active', 'نشط')}</SelectItem>
                        <SelectItem value="inactive">{t('status.inactive', 'غير نشط')}</SelectItem>
                        <SelectItem value="suspended">معلق / إجازة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">رقم الهاتف</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+212 ..."
                      dir="ltr"
                      className="rounded-xl text-right"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">رقم الواتساب</Label>
                    <Input
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      placeholder="+212 ..."
                      dir="ltr"
                      className="rounded-xl text-right"
                    />
                  </div>

                  {/* Country */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">الدولة</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(val) => setFormData({ ...formData, country: val })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="اختر الدولة" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">المدينة</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="المدينة"
                      className="rounded-xl"
                    />
                  </div>

                  {/* Hire Date */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">تاريخ التعيين</Label>
                    <Input
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">الخبرة المهنية والأكاديمية</Label>
                  <Textarea
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    rows={2}
                    placeholder="وصف لسنوات الخبرة والمجالات التي عمل بها المدرس..."
                    className="rounded-xl"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">نبذة تعريفية (Bio)</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={2}
                    placeholder="نبذة عامة تظهر في ملف المدرس..."
                    className="rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="submit"
                    disabled={updateTeacher.isPending}
                    className="rounded-2xl px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-md shadow-purple-500/20"
                  >
                    {updateTeacher.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <span>حفظ التعديلات</span>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB 3: CERTIFICATIONS & DIPLOMAS */}
            <TabsContent value="certifications" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>الشواهد والشهادات الأكاديمية والمهنية</span>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    عرض وإدارة كافة الشهادات والدبلومات الحاصل عليها الأستاذ
                  </p>
                </div>

                <Button
                  onClick={() => setIsAddingCert(true)}
                  size="sm"
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة شهادة جديدة</span>
                </Button>
              </div>

              {/* Add Certificate Card Form */}
              {isAddingCert && (
                <div className="bg-purple-50/70 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-purple-900 dark:text-purple-200">بيانات الشهادة الجديدة</h5>
                    <button
                      onClick={() => setIsAddingCert(false)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      إلغاء
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">عنوان الشهادة / الدبلوم *</Label>
                      <Input
                        value={newCert.title || ''}
                        onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                        placeholder="مثال: دكتوراه في علوم البيانات"
                        className="rounded-xl bg-background text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الجهة المانحة / الجامعة *</Label>
                      <Input
                        value={newCert.issuer || ''}
                        onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                        placeholder="مثال: جامعة السوربون / معهد ماساتشوستس"
                        className="rounded-xl bg-background text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">تاريخ / سنة الحصول عليها</Label>
                      <Input
                        type="date"
                        value={newCert.issue_date || ''}
                        onChange={(e) => setNewCert({ ...newCert, issue_date: e.target.value })}
                        className="rounded-xl bg-background text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">رفع وثيقة أو رابط الشهادة (PDF / صورة)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleUploadCertFile}
                          disabled={isUploadingCert}
                          className="rounded-xl bg-background text-xs cursor-pointer"
                        />
                        {isUploadingCert && <Loader2 className="w-4 h-4 animate-spin text-purple-600 shrink-0" />}
                      </div>
                      {newCert.file_url && (
                        <p className="text-[11px] text-emerald-600 truncate flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" /> تم رفع الملف بنجاح
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">وصف إضافي أو تخصص دقيق</Label>
                    <Input
                      value={newCert.description || ''}
                      onChange={(e) => setNewCert({ ...newCert, description: e.target.value })}
                      placeholder="ملاحظات حول الشهادة..."
                      className="rounded-xl bg-background text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingCert(false)}
                      className="rounded-xl text-xs"
                    >
                      إلغاء
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddCert}
                      className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    >
                      حفظ الشهادة
                    </Button>
                  </div>
                </div>
              )}

              {/* Certifications List */}
              {certifications.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-3xl p-6 bg-muted/20">
                  <Award className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">لم تتم إضافة أي شواهد أو دبلومات لهذا الأستاذ بعد</p>
                  <Button
                    onClick={() => setIsAddingCert(true)}
                    variant="link"
                    size="sm"
                    className="text-purple-600 text-xs mt-1"
                  >
                    + أضف أول شهادة الآن
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-card p-4 rounded-2xl border border-border shadow-xs hover:border-purple-200 dark:hover:border-purple-800 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                              <Award className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-foreground">{cert.title}</h5>
                              <p className="text-[11px] text-muted-foreground">{cert.issuer}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteCert(cert.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors"
                            title="حذف الشهادة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {cert.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                            {cert.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/50 mt-3">
                        <span>{cert.issue_date || 'تاريخ غير محدد'}</span>
                        {cert.file_url ? (
                          <a
                            href={cert.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>عرض الوثيقة</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">لا يوجد ملف مرفق</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 4: MODULES & LESSONS */}
            <TabsContent value="modules" className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>المقررات الدراسية الموكلة للأستاذ</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  قائمة المواد والمقررات المكلف بتدريسها مع عدد الساعات
                </p>
              </div>

              {modules.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-3xl p-6 bg-muted/20">
                  <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">لا يوجد أي مقرر مسند لهذا المدرس حالياً</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {modules.map((mod: any) => (
                    <div key={mod.id} className="bg-card p-4 rounded-2xl border border-border shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="text-[10px] mb-1">
                            {mod.code}
                          </Badge>
                          <h5 className="text-xs font-bold text-foreground">{mod.name}</h5>
                          <p className="text-[11px] text-muted-foreground">
                            {mod.specialty_name || mod.program_name || 'عام'}
                          </p>
                        </div>
                        <div className="text-left" dir="ltr">
                          <span className="text-xs font-bold text-purple-600">{mod.hours || 0} hrs</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2.5 mt-2.5 border-t border-border/50">
                        <span>الدروس المنجزة: {mod.lessons_count || 0}</span>
                        <span className="text-emerald-600 font-medium">نشط</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Lessons List */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>سجل الحصص والدروس الأخيرة</span>
                </h4>
                {lessons.length === 0 ? (
                  <p className="text-xs text-muted-foreground">لم يتم تسجيل حصص سابقة بعد.</p>
                ) : (
                  <div className="space-y-2">
                    {lessons.slice(0, 5).map((les: any) => (
                      <div
                        key={les.id}
                        className="bg-muted/30 p-3 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{les.title}</p>
                          <span className="text-[11px] text-muted-foreground">
                            {les.module_name} • {les.cohort_name || 'كل الأفواج'}
                          </span>
                        </div>
                        <div className="text-left" dir="ltr">
                          <span className="text-muted-foreground block text-[11px]">
                            {les.scheduled_date ? les.scheduled_date.substring(0, 10) : '-'}
                          </span>
                          <span className="text-emerald-600 font-semibold text-[11px]">
                            {les.present_count || 0} حاضرون
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 5: STUDENTS & PROGRESS */}
            <TabsContent value="students" className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>متابعة الطلاب ونسبة التقدم</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  الطلاب المسجلون في أفواج ومقررات هذا الأستاذ
                </p>
              </div>

              {/* Assignments and Progress Overview */}
              <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">الواجبات والتكليفات المسندة للطلاب</span>
                  <span className="text-xs font-semibold text-purple-600">{assignments.length} واجبات</span>
                </div>

                {assignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">لم يقم الأستاذ بطرح واجبات بعد.</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.slice(0, 4).map((asg: any) => (
                      <div key={asg.id} className="p-2.5 rounded-xl bg-muted/40 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{asg.title}</p>
                          <span className="text-[11px] text-muted-foreground">
                            {asg.module_name} • استحقاق: {asg.due_date ? asg.due_date.substring(0, 10) : '-'}
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-purple-600 block">{asg.submissions_count || 0} تسليم</span>
                          {asg.avg_grade && (
                            <span className="text-[11px] text-emerald-600 font-medium">معدل: {Math.round(asg.avg_grade)}/20</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Students List */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground">قائمة الطلاب المتابعين ({students.length})</h5>
                {students.length === 0 ? (
                  <div className="text-center py-6 border border-dashed rounded-2xl p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground">لا يوجد طلاب مسجلون في الأفواج المسندة حالياً</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {students.map((st: any) => (
                      <div
                        key={st.id}
                        className="p-2.5 rounded-xl bg-card border border-border/70 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {((st.full_name || '?')[0] || '').toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">{st.full_name}</span>
                            <span className="text-[10px] text-muted-foreground">{st.email}</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge variant="secondary" className="text-[10px]">
                            {st.cohort_name || 'الفوج'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
