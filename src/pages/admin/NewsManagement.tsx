import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormModal } from '@/components/common/FormModal';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { useAllNews, useCreateNews, useUpdateNews, useDeleteNews } from '@/hooks/useAdminFeatures';
import { Plus, Edit, Trash2, Newspaper, Bell, Award, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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

interface NewsForm {
  title: string;
  content: string;
  type: string;
  priority: string;
  target_audience: string;
  is_published: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'news': return <Newspaper className="h-4 w-4" />;
    case 'announcement': return <Bell className="h-4 w-4" />;
    case 'exam_result': return <Award className="h-4 w-4" />;
    default: return <MessageSquare className="h-4 w-4" />;
  }
};

export default function NewsManagement() {
  const { t } = useTranslation();
  const { data: news, isLoading } = useAllNews();
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<typeof news[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewsForm>({
    title: '',
    content: '',
    type: 'news',
    priority: 'medium',
    target_audience: 'all',
    is_published: true,
  });

  const openAddModal = () => {
    setEditingNews(null);
    setFormData({ title: '', content: '', type: 'news', priority: 'medium', target_audience: 'all', is_published: true });
    setIsModalOpen(true);
  };

  const openEditModal = (item: typeof news[0]) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      priority: item.priority || 'medium',
      target_audience: item.target_audience || 'all',
      is_published: item.is_published ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    if (editingNews) {
      await updateNews.mutateAsync({ id: editingNews.id, ...formData });
    } else {
      await createNews.mutateAsync(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteNews.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.newsManagement')}
        description={t('admin.newsManagementDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: t('admin.news') }]}
        actions={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('admin.addNews')}
          </Button>
        }
      />

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.title')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('admin.type')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('admin.audience')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('admin.priority')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.status')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.date')}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground rtl:text-left">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-20" /></td>
                  </tr>
                ))
              ) : news?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                news?.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="font-medium text-foreground">{item.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground capitalize">{item.type.replace('_', ' ')}</td>
                    <td className="p-4 text-sm text-foreground capitalize">{item.target_audience}</td>
                    <td className="p-4">
                      <StatusBadge 
                        status={item.priority || 'medium'} 
                        variant={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'} 
                      />
                    </td>
                    <td className="p-4">
                      <StatusBadge 
                        status={item.is_published ? t('status.published') : t('status.draft')} 
                        variant={item.is_published ? 'success' : 'default'} 
                      />
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        title={editingNews ? t('admin.editNews') : t('admin.addNews')} 
        onSubmit={handleSubmit} 
        submitLabel={t('common.save')}
        isLoading={createNews.isPending || updateNews.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('table.title')} *</Label>
            <Input 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.content')} *</Label>
            <Textarea 
              value={formData.content} 
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              maxLength={5000}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.type')}</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">{t('admin.news')}</SelectItem>
                  <SelectItem value="announcement">{t('admin.announcement')}</SelectItem>
                  <SelectItem value="update">{t('admin.update')}</SelectItem>
                  <SelectItem value="exam_result">{t('admin.examResult')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.priority')}</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('status.low')}</SelectItem>
                  <SelectItem value="medium">{t('status.medium')}</SelectItem>
                  <SelectItem value="high">{t('status.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('admin.audience')}</Label>
            <Select 
              value={formData.target_audience} 
              onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="students">{t('nav.students')}</SelectItem>
                <SelectItem value="teachers">{t('nav.teachers')}</SelectItem>
                <SelectItem value="admins">{t('admin.admins')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('admin.published')}</Label>
            <Switch
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
            />
          </div>
        </div>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('admin.news')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.deleteConfirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
