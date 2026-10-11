import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { useTeachers } from '@/hooks/useDashboardData';
import { useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '@/hooks/useEntityMutations';
import { Search, Edit, Trash2, UserPlus, Mail, Lock, Globe, MapPin, MessageCircle, Loader2, BookOpen, Briefcase, User, Eye, Award } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { COUNTRIES } from '@/data/countries';
import { TeacherDetailModal } from '@/components/admin/TeacherDetailModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TeachersManagement() {
  const { t } = useTranslation();
  const { data: teachers, isLoading } = useTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add Teacher Dialog State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    country: '',
    city: '',
    whatsappNumber: '',
    specialty: '',
    experience: '',
    status: 'active',
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});

  const validateAddForm = () => {
    const errs: Record<string, string> = {};
    if (!addFormData.fullName.trim()) errs.fullName = (t('auth.fullName') || 'Full name') + ' is required';
    if (!addFormData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addFormData.email)) {
      errs.email = 'Invalid email address';
    }
    if (!addFormData.password) {
      errs.password = 'Password is required';
    } else if (addFormData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    if (!addFormData.country) errs.country = 'Country is required';
    if (!addFormData.city.trim()) errs.city = 'City is required';
    if (!addFormData.whatsappNumber.trim()) errs.whatsappNumber = 'WhatsApp number is required';
    if (!addFormData.specialty.trim()) errs.specialty = 'Specialty is required';
    if (!addFormData.experience.trim()) errs.experience = 'Experience description is required';

    setAddFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddSubmit = async () => {
    if (!validateAddForm()) return;
    try {
      await createTeacher.mutateAsync({
        fullName: addFormData.fullName.trim(),
        email: addFormData.email.trim(),
        password: addFormData.password,
        country: addFormData.country,
        city: addFormData.city.trim(),
        whatsappNumber: addFormData.whatsappNumber.trim(),
        specialty: addFormData.specialty.trim(),
        experience: addFormData.experience.trim(),
        status: addFormData.status || 'active',
      });
      setIsAddModalOpen(false);
      setAddFormData({
        fullName: '',
        email: '',
        password: '',
        country: '',
        city: '',
        whatsappNumber: '',
        specialty: '',
        experience: '',
        status: 'active',
      });
      setAddFormErrors({});
    } catch {
      // Handled in mutation hook
    }
  };

  const filteredTeachers = teachers?.filter((teacher) => {
    const name = (teacher.full_name || teacher.profile?.full_name || '').toLowerCase();
    const email = (teacher.email || teacher.profile?.email || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  }) || [];

  const openEditModal = (teacher: typeof teachers[0]) => {
    setSelectedTeacherId(teacher.id);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTeacher.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.teachersManagement')}
        description={t('admin.teachersManagementDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: t('nav.teachers') }]}
        actions={
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2">
            <UserPlus className="h-4 w-4" />
            {t('admin.addTeacher')}
          </Button>
        }
      />

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
        <Input 
          placeholder={`${t('common.search')}...`} 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-10 rtl:pl-3 rtl:pr-10" 
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6 shadow-md border border-border">
              <div className="flex items-start gap-4 mb-4">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : filteredTeachers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {t('common.noData')}
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary-foreground">
                      {((teacher.full_name || teacher.profile?.full_name) || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{teacher.full_name || teacher.profile?.full_name || t('common.unknown')}</h3>
                    <p className="text-sm text-muted-foreground">{teacher.email || teacher.profile?.email || ''}</p>
                  </div>
                </div>
                <StatusBadge 
                  status={t(`status.${teacher.status || 'active'}`)} 
                  variant={getStatusVariant(teacher.status || 'active')} 
                />
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('table.specialty')}</span>
                  <span className="font-medium text-foreground">{teacher.specialty || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('table.date')}</span>
                  <span className="font-medium text-foreground">{teacher.hire_date || '-'}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 bg-purple-50/60 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50 font-semibold gap-1.5" 
                  onClick={() => openEditModal(teacher)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>تعديل والملف الشامل</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(teacher.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Teacher Detail & Full Profile Modal */}
      <TeacherDetailModal
        teacherId={selectedTeacherId}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('nav.teachers')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Teacher Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              {t('admin.addTeacher')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.teachersManagementDesc') || 'Register a new teacher or faculty member.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="teach-fullName" className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                {t('auth.fullName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="teach-fullName"
                value={addFormData.fullName}
                onChange={(e) => setAddFormData({ ...addFormData, fullName: e.target.value })}
                placeholder="e.g. Dr. Ahmed Mansour / د. أحمد منصور"
              />
              {addFormErrors.fullName && <p className="text-xs text-destructive">{addFormErrors.fullName}</p>}
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="teach-email" className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {t('login.emailAddress')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teach-email"
                  type="email"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  placeholder="teacher@example.com"
                />
                {addFormErrors.email && <p className="text-xs text-destructive">{addFormErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="teach-password" className="text-sm font-medium flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  {t('login.password')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teach-password"
                  type="password"
                  value={addFormData.password}
                  onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                  placeholder="•••••••• (min 8 chars)"
                />
                {addFormErrors.password && <p className="text-xs text-destructive">{addFormErrors.password}</p>}
              </div>
            </div>

            {/* Country & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="teach-country" className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {t('table.country') || 'Country'} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={addFormData.country}
                  onValueChange={(val) => setAddFormData({ ...addFormData, country: val })}
                >
                  <SelectTrigger id="teach-country">
                    <SelectValue placeholder="Select Country..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addFormErrors.country && <p className="text-xs text-destructive">{addFormErrors.country}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="teach-city" className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {t('table.city') || 'City'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teach-city"
                  value={addFormData.city}
                  onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                  placeholder="e.g. Cairo / Rabat"
                />
                {addFormErrors.city && <p className="text-xs text-destructive">{addFormErrors.city}</p>}
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-1.5">
              <Label htmlFor="teach-whatsapp" className="text-sm font-medium flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                WhatsApp Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="teach-whatsapp"
                type="tel"
                value={addFormData.whatsappNumber}
                onChange={(e) => setAddFormData({ ...addFormData, whatsappNumber: e.target.value })}
                placeholder="+1234567890"
              />
              {addFormErrors.whatsappNumber && <p className="text-xs text-destructive">{addFormErrors.whatsappNumber}</p>}
            </div>

            {/* Specialty / Domain */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label htmlFor="teach-specialty" className="text-sm font-medium flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Spécialité / Domaine / {t('table.specialty')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="teach-specialty"
                value={addFormData.specialty}
                onChange={(e) => setAddFormData({ ...addFormData, specialty: e.target.value })}
                placeholder="Ex: Mathématiques, Informatique, Intelligence Artificielle..."
              />
              {addFormErrors.specialty && <p className="text-xs text-destructive">{addFormErrors.specialty}</p>}
            </div>

            {/* Experience (Years / Details) */}
            <div className="space-y-1.5">
              <Label htmlFor="teach-experience" className="text-sm font-medium flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Expérience (Années / Détails) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="teach-experience"
                value={addFormData.experience}
                onChange={(e) => setAddFormData({ ...addFormData, experience: e.target.value })}
                placeholder="Ex: 5 ans d'expérience dans l'enseignement universitaire..."
              />
              {addFormErrors.experience && <p className="text-xs text-destructive">{addFormErrors.experience}</p>}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="teach-status" className="text-sm font-medium">
                {t('table.status')}
              </Label>
              <Select
                value={addFormData.status}
                onValueChange={(val) => setAddFormData({ ...addFormData, status: val })}
              >
                <SelectTrigger id="teach-status">
                  <SelectValue placeholder={t('table.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('status.active')}</SelectItem>
                  <SelectItem value="pending">{t('status.pending') || 'Pending'}</SelectItem>
                  <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddSubmit} disabled={createTeacher.isPending} className="bg-primary text-primary-foreground">
              {createTeacher.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving') || 'Saving...'}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
