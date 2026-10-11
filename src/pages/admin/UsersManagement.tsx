import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { adminService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Users, Shield, Search, Loader2, Phone, CheckCircle, XCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'teacher' | 'student';
  created_at: string;
  whatsapp_number: string | null;
  whatsapp_verified: boolean;
}

export default function UsersManagement() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: t('auth.error'),
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowDialog(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser || !newRole || newRole === selectedUser.role) {
      setShowDialog(false);
      return;
    }

    setUpdating(true);
    try {
      await adminService.updateUserRole(selectedUser.id, newRole);

      toast({
        title: t('auth.success'),
        description: `Role updated to ${newRole}`,
      });

      // Update local state
      setUsers(users.map((u) => 
        u.id === selectedUser.id ? { ...u, role: newRole as 'admin' | 'teacher' | 'student' } : u
      ));
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: t('auth.error'),
        description: 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
      setShowDialog(false);
    }
  };

  const toggleWhatsAppVerification = async (user: UserWithRole) => {
    try {
      setUsers(users.map((u) => 
        u.id === user.id ? { ...u, whatsapp_verified: !user.whatsapp_verified } : u
      ));

      toast({
        title: t('auth.success'),
        description: user.whatsapp_verified 
          ? 'WhatsApp verification removed' 
          : 'WhatsApp verified successfully',
      });
    } catch (error) {
      console.error('Error toggling WhatsApp verification:', error);
      toast({
        title: t('auth.error'),
        description: 'Failed to update WhatsApp verification',
        variant: 'destructive',
      });
    }
  };

  // Bulk selection handlers
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const toggleSelectAll = () => {
    const usersWithWhatsApp = filteredUsers.filter(u => u.whatsapp_number);
    if (selectedUserIds.size === usersWithWhatsApp.length && usersWithWhatsApp.length > 0) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(usersWithWhatsApp.map(u => u.id)));
    }
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  // Bulk WhatsApp verification
  const bulkVerifyWhatsApp = async (verify: boolean) => {
    if (selectedUserIds.size === 0) return;

    setBulkUpdating(true);
    try {
      setUsers(users.map((u) => 
        selectedUserIds.has(u.id) ? { ...u, whatsapp_verified: verify } : u
      ));

      toast({
        title: t('auth.success'),
        description: `${selectedUserIds.size} user(s) WhatsApp ${verify ? 'verified' : 'unverified'} successfully`,
      });

      clearSelection();
    } catch (error) {
      console.error('Error bulk updating WhatsApp verification:', error);
      toast({
        title: t('auth.error'),
        description: 'Failed to update WhatsApp verification',
        variant: 'destructive',
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const usersWithWhatsApp = filteredUsers.filter(u => u.whatsapp_number);
  const selectedUsersWithWhatsApp = Array.from(selectedUserIds).filter(id => 
    users.find(u => u.id === id)?.whatsapp_number
  );

  const getRoleVariant = (role: string): 'default' | 'error' | 'info' | 'success' | 'warning' => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'teacher':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.usersManagement')}
        description={t('admin.usersManagementDesc')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/admin' },
          { label: t('nav.users') },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.totalUsers')}</p>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-xl">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('roles.admin')}s</p>
              <p className="text-2xl font-bold text-foreground">
                {users.filter((u) => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Phone className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">WhatsApp Verified</p>
              <p className="text-2xl font-bold text-foreground">
                {users.filter((u) => u.whatsapp_verified).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            placeholder={`${t('common.search')}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rtl:pl-3 rtl:pr-10"
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUserIds.size > 0 && (
        <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedUserIds.size} user(s) selected
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkVerifyWhatsApp(true)}
              disabled={bulkUpdating || selectedUsersWithWhatsApp.length === 0}
              className="gap-2"
            >
              {bulkUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              Verify WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkVerifyWhatsApp(false)}
              disabled={bulkUpdating || selectedUsersWithWhatsApp.length === 0}
              className="gap-2"
            >
              {bulkUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              Unverify WhatsApp
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="table-container">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{t('admin.usersList')}</h3>
            {usersWithWhatsApp.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {usersWithWhatsApp.length} users with WhatsApp
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="w-12 p-4">
                    <Checkbox
                      checked={
                        usersWithWhatsApp.length > 0 && 
                        selectedUserIds.size === usersWithWhatsApp.length
                      }
                      onCheckedChange={toggleSelectAll}
                      disabled={usersWithWhatsApp.length === 0}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                    {t('table.name')}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                    {t('table.email')}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                    WhatsApp
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                    {t('admin.role')}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">
                    {t('admin.joined')}
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground rtl:text-left">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      "border-b border-border hover:bg-secondary/30 transition-colors",
                      selectedUserIds.has(user.id) && "bg-primary/5"
                    )}
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedUserIds.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                        disabled={!user.whatsapp_number}
                      />
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      {user.full_name || '-'}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      {user.whatsapp_number ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => toggleWhatsAppVerification(user)}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                                  user.whatsapp_verified 
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50" 
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                                )}
                              >
                                {user.whatsapp_verified ? (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                                <Phone className="h-3 w-3" />
                                <span className="hidden sm:inline">{user.whatsapp_number}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{user.whatsapp_number}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.whatsapp_verified ? 'Verified - Click to unverify' : 'Not verified - Click to verify'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge
                        status={t(`roles.${user.role}`)}
                        variant={getRoleVariant(user.role)}
                      />
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 rtl:justify-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user)}
                        >
                          {t('admin.changeRole')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.changeRole')}</DialogTitle>
            <DialogDescription>
              Change role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">{t('roles.student')}</SelectItem>
                <SelectItem value="teacher">{t('roles.teacher')}</SelectItem>
                <SelectItem value="admin">{t('roles.admin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmRoleChange} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
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