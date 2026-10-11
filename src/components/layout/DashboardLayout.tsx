import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { TopBar } from './TopBar';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role: userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (role && userRole && userRole !== role && userRole !== 'admin') {
        // C7 FIX: Redirect unauthorized user to their proper dashboard
        const target = userRole === 'teacher' ? '/teacher' : '/student';
        navigate(target, { replace: true });
      }
    }
  }, [user, userRole, role, loading, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Block rendering if not authenticated or unauthorized role
  if (!user || (role && userRole && userRole !== role && userRole !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        role={role} 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <div className="lg:ltr:ml-64 lg:rtl:mr-64">
        <TopBar role={role} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
