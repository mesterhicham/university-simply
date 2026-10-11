import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlatformLogo } from '@/components/PlatformLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GraduationCap, Mail, Lock, User, ArrowLeft, Loader2, MapPin, Globe, MessageCircle, Briefcase, BookOpen } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh",
  "Belgium", "Brazil", "Canada", "China", "Colombia", "Denmark", "Egypt", "Finland",
  "France", "Germany", "Ghana", "Greece", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Italy", "Japan", "Jordan", "Kenya", "Kuwait", "Lebanon", "Libya", "Malaysia", "Mexico",
  "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Oman", "Pakistan",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
  "Senegal", "Singapore", "South Africa", "South Korea", "Spain", "Sudan", "Sweden",
  "Switzerland", "Syria", "Thailand", "Tunisia", "Turkey", "UAE", "Uganda", "UK",
  "Ukraine", "USA", "Vietnam", "Yemen"
];

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, signIn, signUp, loading: authLoading } = useAuth();

  const mode = searchParams.get('mode');
  const redirectPath = searchParams.get('redirect');

  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    fullName?: string;
    city?: string;
    country?: string;
    whatsapp?: string;
    specialty?: string;
    experience?: string;
  }>({});

  useEffect(() => {
    if (user && role) {
      // M9 FIX: Validate redirect path to prevent open redirects and role bypass
      if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//') && !redirectPath.includes('\\')) {
        const isForbiddenAdmin = redirectPath.startsWith('/admin') && role !== 'admin';
        const isForbiddenTeacher = redirectPath.startsWith('/teacher') && role !== 'teacher' && role !== 'admin';
        if (!isForbiddenAdmin && !isForbiddenTeacher) {
          navigate(redirectPath);
          return;
        }
      }
      const defaultPath = role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student';
      navigate(defaultPath);
    }
  }, [user, role, navigate, redirectPath]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(email);
    } catch (e: any) {
      newErrors.email = e.errors[0].message;
    }

    try {
      passwordSchema.parse(password);
    } catch (e: any) {
      newErrors.password = e.errors[0].message;
    }

    if (!isLogin) {
      if (!fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!city.trim()) newErrors.city = 'City is required';
      if (!country) newErrors.country = 'Country is required';
      if (!whatsappNumber) {
        newErrors.whatsapp = 'WhatsApp number is required';
      }
      
      if (selectedRole === 'teacher') {
        if (!specialty.trim()) newErrors.specialty = 'Specialty is required';
        if (!experience.trim()) newErrors.experience = 'Experience description is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || 'Login failed');
        } else {
          toast.success(t('auth.loginSuccess'));
        }
      } else {
        const { error } = await signUp(email, password, fullName, city, country, whatsappNumber, selectedRole, specialty, experience);
        if (error) {
          toast.error(error.message || 'Signup failed');
        } else {
          toast.success(t('auth.signupSuccess'));
          setIsLogin(true); // Switch to login after successful signup
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex">
      {/* Branding and Form logic remains similar, but using sonner toast */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="mb-8">
            <PlatformLogo 
              textClassName="text-3xl font-bold font-serif text-primary-foreground" 
              imageClassName="h-12 max-w-[220px] object-contain"
              iconClassName="h-10 w-10 text-primary-foreground"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4">{t('login.portalTitle')}</h1>
          <p className="text-lg opacity-90 max-w-md">{t('login.portalDesc')}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center p-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('common.backToHome')}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center mb-6 justify-center">
              <PlatformLogo 
                textClassName="text-2xl font-bold font-serif text-foreground" 
                imageClassName="h-10 max-w-[180px] object-contain"
                iconClassName="h-8 w-8 text-primary"
              />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {isLogin ? t('login.welcomeBack') : t('auth.createAccount')}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isLogin ? t('login.signInToAccount') : t('auth.signUpDesc')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="+1234567890"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">{t('login.selectRole')}</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">{t('roles.student')}</SelectItem>
                        <SelectItem value="teacher">{t('roles.teacher')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
 
                  {selectedRole === 'teacher' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Spécialité / Domaine</Label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="specialty" 
                            placeholder="Ex: Mathématiques, Informatique..." 
                            value={specialty} 
                            onChange={(e) => setSpecialty(e.target.value)} 
                            className="pl-10"
                          />
                        </div>
                        {errors.specialty && <p className="text-xs text-destructive">{errors.specialty}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Expérience (Années / Détails)</Label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="experience" 
                            placeholder="Ex: 5 ans d'expérience..." 
                            value={experience} 
                            onChange={(e) => setExperience(e.target.value)} 
                            className="pl-10"
                          />
                        </div>
                        {errors.experience && <p className="text-xs text-destructive">{errors.experience}</p>}
                      </div>
                    </>
                  )}

                  </>
                )}

                <div className="space-y-2">
                <Label htmlFor="email">{t('login.emailAddress')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (isLogin ? t('common.signIn') : t('auth.signUp'))}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
                  {isLogin ? t('auth.signUp') : t('common.signIn')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
