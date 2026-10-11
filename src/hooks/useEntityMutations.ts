import { useMutation, useQueryClient } from '@tanstack/react-query';
import { academicService } from '@/services/apiService';
import { toast } from 'sonner';

// ============= PROGRAMS =============
export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create program: ${error.message}`);
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.updateProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update program: ${error.message}`);
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.deleteProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete program: ${error.message}`);
    },
  });
}

// ============= SPECIALTIES =============
export function useCreateSpecialty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.createSpecialty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      toast.success('Specialty created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create specialty: ${error.message}`);
    },
  });
}

export function useUpdateSpecialty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.updateSpecialty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      toast.success('Specialty updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update specialty: ${error.message}`);
    },
  });
}

export function useDeleteSpecialty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.deleteSpecialty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      toast.success('Specialty deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete specialty: ${error.message}`);
    },
  });
}

// ============= COHORTS =============
export function useCreateCohort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.createCohort,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      toast.success('Cohort created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create cohort: ${error.message}`);
    },
  });
}

export function useUpdateCohort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.updateCohort,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      toast.success('Cohort updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update cohort: ${error.message}`);
    },
  });
}

export function useDeleteCohort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.deleteCohort,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      toast.success('Cohort deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete cohort: ${error.message}`);
    },
  });
}

// ============= MODULES =============
export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-modules-cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-modules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('تمت إضافة المقرر بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل في إضافة المقرر: ${error.message}`);
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.updateModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-modules-cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-modules'] });
      queryClient.invalidateQueries({ queryKey: ['student-modules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Module updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update module: ${error.message}`);
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-modules-cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-modules'] });
      queryClient.invalidateQueries({ queryKey: ['student-modules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Module deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete module: ${error.message}`);
    },
  });
}

// ============= STUDENTS =============
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('تمت إضافة الطالب بنجاح');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.message || 'فشل في إضافة الطالب';
      toast.error(msg);
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.updateStudent,
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['student-details', variables.id] });
      }
      toast.success('تم تحديث بيانات الطالب بنجاح');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.message || 'فشل في تحديث بيانات الطالب';
      toast.error(msg);
    },
  });
}

export function useAddStudentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.addStudentPayment,
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['student-details', variables.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('تم تسجيل الدفعة المالية بنجاح');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.message || 'فشل في تسجيل الدفعة';
      toast.error(msg);
    },
  });
}

export function useImpersonateStudent() {
  return useMutation({
    mutationFn: (id: string) => academicService.impersonateStudent(id),
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.message || 'فشل في تسجيل الدخول كطالب';
      toast.error(msg);
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete student: ${error.message}`);
    },
  });
}

// ============= TEACHERS =============
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('تمت إضافة الأستاذ بنجاح');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.message || 'فشل في إضافة الأستاذ';
      toast.error(msg);
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.updateTeacher,
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['teacher-details', variables.id] });
      }
      toast.success('تم تحديث بيانات الأستاذ بنجاح');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.message || 'فشل في تحديث بيانات الأستاذ';
      toast.error(msg);
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: academicService.deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete teacher: ${error.message}`);
    },
  });
}
