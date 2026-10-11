import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useStudentAssignments, useMySubmissions, useSubmitAssignment } from '@/hooks/useStudentData';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Calendar, FileText, Check, Clock, Image, File, ExternalLink } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function StudentAssignments() {
  const { t } = useTranslation();
  
  const { data: assignments, isLoading } = useStudentAssignments();
  const { data: mySubmissions } = useMySubmissions();
  const submitAssignment = useSubmitAssignment();
  
  const [submitModal, setSubmitModal] = useState<{ open: boolean; assignment: any }>({
    open: false,
    assignment: null,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMySubmission = (assignmentId: string) => {
    return mySubmissions?.find(s => s.assignment_id === assignmentId);
  };

  const handleSubmit = async () => {
    if (!submitModal.assignment || !selectedFile) return;
    
    await submitAssignment.mutateAsync({
      assignmentId: submitModal.assignment.id,
      file: selectedFile,
      submissionText,
    });
    
    setSubmitModal({ open: false, assignment: null });
    setSelectedFile(null);
    setSubmissionText('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images and PDFs only)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('يرجى اختيار صورة أو ملف PDF فقط');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم الملف كبير جداً (الحد الأقصى 10MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <PageHeader title={t('nav.assignments')} breadcrumbs={[{ label: t('nav.dashboard'), href: '/student' }, { label: t('nav.assignments') }]} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <PageHeader title={t('nav.assignments')} breadcrumbs={[{ label: t('nav.dashboard'), href: '/student' }, { label: t('nav.assignments') }]} />
      
      {!assignments || assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد واجبات متاحة حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const mySubmission = getMySubmission(assignment.id);
            const isOverdue = isPast(new Date(assignment.due_date));
            const canSubmit = !isOverdue && assignment.status === 'active' && !mySubmission;
            
            return (
              <Card key={assignment.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">{assignment.title}</h3>
                          {assignment.module && (
                            <p className="text-sm text-muted-foreground">{assignment.module.name}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {t('teacher.due')}: {format(new Date(assignment.due_date), 'PPP', { locale: ar })}
                            </span>
                            {assignment.max_grade && (
                              <span>الدرجة القصوى: {assignment.max_grade}</span>
                            )}
                          </div>
                          
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted rounded-lg">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2">
                        {isOverdue && !mySubmission && (
                          <Badge variant="destructive">انتهى الوقت</Badge>
                        )}
                        <StatusBadge 
                          status={assignment.status === 'active' ? 'نشط' : 'مغلق'} 
                          variant={getStatusVariant(assignment.status || 'active')} 
                        />
                      </div>
                      
                      {/* Submission Status */}
                      {mySubmission ? (
                        <div className="text-right space-y-2">
                          <Badge variant="default" className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            تم التسليم
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(mySubmission.submitted_at), 'PPP p', { locale: ar })}
                          </p>
                          {mySubmission.status === 'graded' && (
                            <div className="bg-primary/10 p-3 rounded-lg">
                              <p className="font-bold text-primary">
                                الدرجة: {mySubmission.grade}/{assignment.max_grade}
                              </p>
                              {mySubmission.feedback && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {mySubmission.feedback}
                                </p>
                              )}
                            </div>
                          )}
                          {mySubmission.submission_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(mySubmission.submission_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                              عرض التسليم
                            </Button>
                          )}
                        </div>
                      ) : canSubmit ? (
                        <Button onClick={() => setSubmitModal({ open: true, assignment })}>
                          <Upload className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          تسليم الواجب
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Assignment Dialog */}
      <Dialog open={submitModal.open} onOpenChange={(open) => {
        setSubmitModal({ open, assignment: open ? submitModal.assignment : null });
        if (!open) {
          setSelectedFile(null);
          setSubmissionText('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسليم الواجب</DialogTitle>
            <DialogDescription>
              {submitModal.assignment?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>الملف (صورة أو PDF) *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    {selectedFile.type.startsWith('image/') ? (
                      <Image className="h-8 w-8 text-primary" />
                    ) : (
                      <File className="h-8 w-8 text-primary" />
                    )}
                    <div className="text-right">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      اضغط لاختيار ملف
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      صور أو PDF (حد أقصى 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {/* Additional Notes */}
            <div className="space-y-2">
              <Label>ملاحظات إضافية (اختياري)</Label>
              <Textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="أضف أي ملاحظات للمعلم..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitModal({ open: false, assignment: null })}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedFile || submitAssignment.isPending}
            >
              {submitAssignment.isPending ? 'جاري التسليم...' : 'تسليم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
