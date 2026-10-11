import { Bell, Menu, User, LogOut, Download, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  role: UserRole;
  onMenuClick: () => void;
}

export function TopBar({ role, onMenuClick }: TopBarProps) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isInstalled, promptInstall } = usePWAInstall();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Display name
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'System Admin';
  const roleLabel = role === 'admin' 
    ? 'System Administrator' 
    : role === 'teacher' 
    ? 'Faculty Instructor' 
    : 'Registered Student';

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between h-20 px-4 lg:px-8">
        {/* Left side: Greeting + Mobile Menu */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden h-10 w-10 rounded-2xl text-slate-600 hover:bg-slate-100 dark:text-slate-300">
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <span>{t('admin.welcomePrefix', 'Welcome')}, {displayName}</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Right side: Install App + Notifications + Profile */}
        <div className="flex items-center gap-3">
          {/* Install App Button (Supports Desktop, Tablet, Mobile) */}
          {!isInstalled ? (
            <button
              onClick={promptInstall}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl px-3.5 py-2 text-xs font-semibold shadow-sm shadow-purple-500/20 transition-all active:scale-95"
              title={t('common.installApp', 'Install App on Device')}
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t('common.installApp', 'Install App')}</span>
            </button>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-2xl text-xs font-medium border border-emerald-100 dark:border-emerald-900/40">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{t('common.appInstalled', 'App Installed')}</span>
            </div>
          )}


          {/* Notification Button */}
          <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </Button>

          {/* User Profile Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-purple-500/20">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100 dark:border-slate-800">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 font-normal truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate(`/${role}/profile`)}
                className="rounded-xl px-3 py-2 text-sm cursor-pointer"
              >
                <User className="h-4 w-4 mr-2 rtl:ml-2" />
                <span>{t('nav.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="rounded-xl px-3 py-2 text-sm text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2 rtl:ml-2" />
                <span>{t('common.signOut')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
