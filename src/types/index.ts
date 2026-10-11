export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  program: string;
  specialty: string;
  cohort: string;
  enrollmentDate: string;
  status: 'active' | 'graduated' | 'suspended';
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  specialty: string;
  modules: string[];
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface Program {
  id: string;
  name: string;
  duration: string;
  description: string;
  image_url?: string | null;
  specialties?: number;
  students?: number;
}

export interface Specialty {
  id: string;
  name: string;
  program: string;
  modules: number;
  students: number;
}

export interface Cohort {
  id: string;
  name: string;
  program: string;
  specialty: string;
  startDate: string;
  endDate: string;
  students: number;
  status: 'active' | 'completed' | 'upcoming';
}

export interface Module {
  id: string;
  name: string;
  code: string;
  specialty: string;
  hours: number;
  teacher: string;
}

export interface Lesson {
  id: string;
  title: string;
  module: string;
  date: string;
  duration: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Assignment {
  id: string;
  title: string;
  module: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  status: 'active' | 'closed';
}

export interface Diploma {
  id: string;
  serialNumber: string;
  studentName: string;
  program: string;
  specialty: string;
  issueDate: string;
  status: 'issued' | 'pending';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Grade {
  id: string;
  module: string;
  assignment: string;
  grade: number;
  maxGrade: number;
  date: string;
}

export interface Attendance {
  id: string;
  date: string;
  module: string;
  status: 'present' | 'absent' | 'late';
}
