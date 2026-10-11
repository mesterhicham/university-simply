import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { 
  useEmailSettings, 
  useSaveEmailSettings, 
  useEmailTemplates, 
  useUpdateEmailTemplate, 
  useEmailLogs,
  useSendTestEmail 
} from '@/hooks/useAdminFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, 
  Mail, 
  FileText, 
  History, 
  Save, 
  Loader2, 
  Eye, 
  EyeOff, 
  TestTube,
  Send,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FormModal } from '@/components/common/FormModal';
import { toast } from 'sonner';

export default function EmailSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useEmailSettings();
  const { data: templates = [], isLoading: templatesLoading } = useEmailTemplates();
  const { data: logs = [], isLoading: logsLoading } = useEmailLogs();
  const saveSettings = useSaveEmailSettings();
  const updateTemplate = useUpdateEmailTemplate();
  const sendTestEmail = useSendTestEmail();
  
  const [showPassword, setShowPassword] = useState(false);
  const [emailForm, setEmailForm] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    encryption: 'tls',
    from_email: '',
    from_name: '',
    is_active: false,
  });
  const [formInitialized, setFormInitialized] = useState(false);
  
  // Test Email Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');

  // Template Editing State
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({ subject: '', body_html: '', is_active: true });

  // Initialize form with settings once loaded
  useEffect(() => {
    if (settings && !formInitialized) {
      setEmailForm({
        smtp_host: settings.smtp_host || '',
        smtp_port: settings.smtp_port || 587,
        smtp_username: settings.smtp_username || '',
        smtp_password: settings.smtp_password || '',
        encryption: settings.encryption || 'tls',
        from_email: settings.from_email || '',
        from_name: settings.from_name || '',
        is_active: settings.is_active ?? false,
      });
      setFormInitialized(true);
    }
  }, [settings, formInitialized]);

  const handleSaveSettings = async () => {
    await saveSettings.mutateAsync(emailForm);
  };

  const handleOpenTestModal = () => {
    setTestRecipient(user?.email || '');
    setIsTestModalOpen(true);
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient || !testRecipient.includes('@')) {
      toast.error(t('common.invalidEmail', 'Please enter a valid recipient email address'));
      return;
    }
    try {
      await sendTestEmail.mutateAsync({ recipient_email: testRecipient.trim() });
      setIsTestModalOpen(false);
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateForm({
      subject: template.subject,
      body_html: template.body_html,
      is_active: template.is_active ?? true,
    });
  };

  const handleSaveTemplate = async () => {
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, ...templateForm });
      setEditingTemplate(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.emailSettings', 'Email Settings')}
        description={t('admin.emailSettingsDesc', 'Configure SMTP mail server, manage notification templates, and inspect transmission logs.')}
        breadcrumbs={[{ label: t('nav.dashboard', 'Dashboard'), href: '/admin' }, { label: t('admin.emailSettings', 'Email Settings') }]}
        icon={Mail}
      />

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl">
          <TabsTrigger value="settings" className="flex items-center gap-2 rounded-xl">
            <Settings className="h-4 w-4" />
            {t('admin.smtpSettings', 'SMTP Settings')}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2 rounded-xl">
            <FileText className="h-4 w-4" />
            {t('admin.templates', 'Email Templates')}
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2 rounded-xl">
            <History className="h-4 w-4" />
            {t('admin.emailLogs', 'Email Logs')}
          </TabsTrigger>
        </TabsList>

        {/* 1. SMTP Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Status Alert Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-colors ${
            emailForm.is_active 
              ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20' 
              : 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20'
          }`}>
            <div className="flex items-center gap-3">
              {emailForm.is_active ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span>{t('admin.emailServiceStatus', 'Email Service Status')}</span>
                  <Badge variant={emailForm.is_active ? 'default' : 'secondary'} className={emailForm.is_active ? 'bg-emerald-600' : ''}>
                    {emailForm.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {emailForm.is_active 
                    ? t('admin.emailServiceActiveDesc', 'Automatic outgoing emails for registration, passwords, and notices are enabled.') 
                    : t('admin.emailServiceDisabledDesc', 'Outgoing emails are disabled. Enable the switch below to activate delivery.')}
                </p>
              </div>
            </div>
            <Switch
              checked={emailForm.is_active}
              onCheckedChange={(checked) => setEmailForm(prev => ({ ...prev, is_active: checked }))}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          <Card className="rounded-3xl border-border/80 shadow-xs">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {t('admin.smtpConfiguration', 'SMTP Configuration')}
              </CardTitle>
              <CardDescription>
                {t('admin.smtpConfigurationDesc', 'Configure connection parameters for your SMTP mail service provider.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {settingsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_host">{t('admin.smtpHost', 'SMTP Host')}</Label>
                      <Input
                        id="smtp_host"
                        value={emailForm.smtp_host}
                        onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                        placeholder="smtp.gmail.com / mail.example.com"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_port">{t('admin.smtpPort', 'SMTP Port')}</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={emailForm.smtp_port}
                        onChange={(e) => setEmailForm({ ...emailForm, smtp_port: parseInt(e.target.value) || 587 })}
                        placeholder="587 / 465 / 25"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_username">{t('admin.smtpUsername', 'SMTP Username / Account')}</Label>
                      <Input
                        id="smtp_username"
                        value={emailForm.smtp_username}
                        onChange={(e) => setEmailForm({ ...emailForm, smtp_username: e.target.value })}
                        placeholder="user@example.com"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_password">{t('admin.smtpPassword', 'SMTP Password / App Key')}</Label>
                      <div className="relative">
                        <Input
                          id="smtp_password"
                          type={showPassword ? 'text' : 'password'}
                          value={emailForm.smtp_password}
                          onChange={(e) => setEmailForm({ ...emailForm, smtp_password: e.target.value })}
                          placeholder="••••••••••••"
                          className="rounded-xl ltr:pr-10 rtl:pl-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute ltr:right-1 rtl:left-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="encryption">{t('admin.encryption', 'Security Encryption')}</Label>
                      <Select
                        value={emailForm.encryption}
                        onValueChange={(value) => setEmailForm({ ...emailForm, encryption: value })}
                      >
                        <SelectTrigger id="encryption" className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none">None (Plain)</SelectItem>
                          <SelectItem value="tls">TLS (STARTTLS - Port 587)</SelectItem>
                          <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="from_email">{t('admin.fromEmail', 'Sender Email (From)')}</Label>
                      <Input
                        id="from_email"
                        type="email"
                        value={emailForm.from_email}
                        onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                        placeholder="noreply@academyelofoq.com"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="from_name">{t('admin.fromName', 'Sender Name (Display)')}</Label>
                      <Input
                        id="from_name"
                        value={emailForm.from_name}
                        onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
                        placeholder="Simply University Academy"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/40">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={handleOpenTestModal}
                      className="rounded-xl gap-2 border-primary/30 hover:bg-primary/5"
                    >
                      <TestTube className="h-4 w-4 text-primary" />
                      <span>{t('admin.testEmail', 'Send Test Email')}</span>
                    </Button>

                    <Button 
                      onClick={handleSaveSettings} 
                      disabled={saveSettings.isPending}
                      className="rounded-xl gap-2"
                    >
                      {saveSettings.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{t('common.save', 'Save Changes')}</span>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Templates Tab */}
        <TabsContent value="templates">
          <Card className="rounded-3xl border-border/80 shadow-xs">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t('admin.emailTemplates', 'Email Templates')}
              </CardTitle>
              <CardDescription>
                {t('admin.emailTemplatesDesc', 'Customize automated email notifications, subjects, HTML bodies, and placeholders.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {templatesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>{t('admin.noTemplatesFound', 'No email templates configured yet.')}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template: any) => (
                    <div
                      key={template.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-base text-foreground">{template.name}</h4>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary font-mono text-muted-foreground">
                            {template.slug}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          <span className="font-medium text-foreground/80">{t('admin.subject', 'Subject')}: </span>
                          {template.subject}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <StatusBadge
                          status={template.is_active ? t('status.active', 'Active') : t('status.inactive', 'Inactive')}
                          variant={template.is_active ? 'success' : 'default'}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditTemplate(template)}
                          className="rounded-xl text-xs font-medium"
                        >
                          {t('common.edit', 'Edit Template')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Email Transmission Logs Tab */}
        <TabsContent value="logs">
          <Card className="rounded-3xl border-border/80 shadow-xs">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                {t('admin.emailLogs', 'Email Transmission Logs')}
              </CardTitle>
              <CardDescription>
                {t('admin.emailLogsDesc', 'Track all dispatched notifications, delivery outcomes, and error reports.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-start py-3 px-4 font-semibold">{t('admin.recipient', 'Recipient')}</th>
                      <th className="text-start py-3 px-4 font-semibold">{t('admin.subject', 'Subject')}</th>
                      <th className="text-start py-3 px-4 font-semibold">{t('table.status', 'Status')}</th>
                      <th className="text-start py-3 px-4 font-semibold">{t('table.date', 'Dispatched At')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {logsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          <td className="py-3 px-4"><Skeleton className="h-4 w-36 rounded-md" /></td>
                          <td className="py-3 px-4"><Skeleton className="h-4 w-48 rounded-md" /></td>
                          <td className="py-3 px-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                          <td className="py-3 px-4"><Skeleton className="h-4 w-28 rounded-md" /></td>
                        </tr>
                      ))
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-muted-foreground">
                          <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>{t('admin.noEmailsSent', 'No email logs recorded yet.')}</p>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-foreground">{log.recipient_name || log.recipient_email}</p>
                              {log.recipient_name && log.recipient_email && (
                                <p className="text-xs text-muted-foreground">{log.recipient_email}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground max-w-xs truncate">
                            {log.subject}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge
                              status={log.status}
                              variant={log.status === 'sent' ? 'success' : log.status === 'failed' ? 'error' : 'warning'}
                            />
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Template Modal */}
      <FormModal
        open={!!editingTemplate}
        onOpenChange={() => setEditingTemplate(null)}
        title={`${t('common.edit', 'Edit')} ${editingTemplate?.name || ''}`}
        onSubmit={handleSaveTemplate}
        submitLabel={t('common.save', 'Save Template')}
        isLoading={updateTemplate.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('admin.subject', 'Subject Line')}</Label>
            <Input
              value={templateForm.subject}
              onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('admin.bodyHtml', 'HTML Content')}</Label>
            <Textarea
              value={templateForm.body_html}
              onChange={(e) => setTemplateForm({ ...templateForm, body_html: e.target.value })}
              rows={9}
              className="font-mono text-xs rounded-xl"
            />
          </div>

          {editingTemplate?.variables && (
            <div className="p-3 bg-secondary/30 rounded-2xl border border-border/40">
              <p className="text-xs font-semibold text-foreground mb-2">
                {t('admin.availableVariables', 'Supported Dynamic Placeholders')}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(editingTemplate.variables) ? editingTemplate.variables : []).map((v: string) => (
                  <code key={v} className="text-xs bg-muted/80 text-foreground px-2 py-0.5 rounded-md font-mono">
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Switch
              checked={templateForm.is_active}
              onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_active: checked })}
            />
            <Label className="text-sm font-medium">{t('status.active', 'Template Enabled')}</Label>
          </div>
        </div>
      </FormModal>

      {/* Send Test Email Modal */}
      <FormModal
        open={isTestModalOpen}
        onOpenChange={setIsTestModalOpen}
        title={t('admin.testEmailTitle', 'Send SMTP Verification Email')}
        onSubmit={handleSendTestEmail}
        submitLabel={t('admin.sendTest', 'Send Email')}
        isLoading={sendTestEmail.isPending}
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('admin.testEmailInstructions', 'Enter a destination email address to verify your current SMTP server settings.')}
          </p>
          <div className="space-y-2">
            <Label htmlFor="test_recipient">{t('admin.recipientEmail', 'Recipient Email')}</Label>
            <div className="relative">
              <Input
                id="test_recipient"
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="admin@example.com"
                className="rounded-xl ltr:pl-9 rtl:pr-9"
              />
              <Send className="h-4 w-4 text-muted-foreground absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </FormModal>
    </DashboardLayout>
  );
}
