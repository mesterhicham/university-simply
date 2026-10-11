import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlatformLogo } from '@/components/PlatformLogo';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award,
  ArrowRight,
  Menu,
  X,
  Globe,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { usePlatformSettings } from '@/hooks/useAdminFeatures';

export default function Home() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: platformSettings } = usePlatformSettings();

  const getSetting = (key: string, fallback: string = '') => {
    return platformSettings?.map?.[key]?.value || fallback;
  };

  const heroBadge = getSetting('hero_badge', '🎓 مرحباً بكم في جامعة Simply University — التميز والابتكار في التعليم المهني');
  const heroTitle = getSetting('hero_title', t('home.heroTitle'));
  const heroTitleAccent = getSetting('hero_title_accent', t('home.heroTitleAccent'));
  const heroSubtitle = getSetting('hero_subtitle', t('home.heroSubtitle'));
  const heroCtaPrimaryText = getSetting('hero_cta_primary_text', t('home.getStarted'));
  const heroCtaPrimaryLink = getSetting('hero_cta_primary_link', '/auth');
  const heroCtaSecondaryText = getSetting('hero_cta_secondary_text', t('home.explorePrograms'));
  const heroCtaSecondaryLink = getSetting('hero_cta_secondary_link', '#programs');
  const heroImageUrl = getSetting('hero_image_url', '/simply_university_hero.jpg');

  const dynamicStats = [
    { value: getSetting('hero_stat_1_val', '2,500+'), label: getSetting('hero_stat_1_label', t('home.graduates')) },
    { value: getSetting('hero_stat_2_val', '95%'), label: getSetting('hero_stat_2_label', t('home.employmentRate')) },
    { value: getSetting('hero_stat_3_val', '50+'), label: getSetting('hero_stat_3_label', t('home.partnerCompanies')) },
    { value: getSetting('hero_stat_4_val', '25+'), label: getSetting('hero_stat_4_label', t('home.yearsExperience')) },
  ];

  const ctaTitle = getSetting('cta_title', t('home.ctaTitle'));
  const ctaSubtitle = getSetting('cta_subtitle', t('home.ctaSubtitle'));
  const ctaButtonText = getSetting('cta_button_text', t('home.applyNow'));

  const renderCtaButton = (text: string, link: string, variant: 'hero' | 'hero-outline', defaultText: string, defaultLink: string) => {
    const btnText = text || defaultText;
    const btnLink = link || defaultLink;
    const isAnchor = btnLink.startsWith('#') || btnLink.startsWith('http');

    if (isAnchor) {
      return (
        <a href={btnLink}>
          <Button variant={variant} size="xl" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
            {btnText} {variant === 'hero' && <ArrowRight className="ml-2 h-5 w-5 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />}
          </Button>
        </a>
      );
    }

    return (
      <Link to={btnLink}>
        <Button variant={variant} size="xl" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
          {btnText} {variant === 'hero' && <ArrowRight className="ml-2 h-5 w-5 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />}
        </Button>
      </Link>
    );
  };

  const features = [
    { icon: BookOpen, title: t('features.comprehensivePrograms'), description: t('features.comprehensiveProgramsDesc') },
    { icon: Users, title: t('features.expertFaculty'), description: t('features.expertFacultyDesc') },
    { icon: Award, title: t('features.recognizedDiplomas'), description: t('features.recognizedDiplomasDesc') },
    { icon: GraduationCap, title: t('features.careerSupport'), description: t('features.careerSupportDesc') },
  ];

  const programs = [
    {
      name: t('programs.technician'),
      duration: t('programs.duration'),
      description: t('programs.technicianDesc'),
      specialties: [t('specialties.webDev'), t('specialties.networkAdmin'), t('specialties.mobileDev')],
    },
    {
      name: t('programs.specializedTechnician'),
      duration: t('programs.duration'),
      description: t('programs.specializedDesc'),
      specialties: [t('specialties.softwareDev'), t('specialties.databaseMgmt'), t('specialties.cybersecurity'), t('specialties.cloudComputing')],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <PlatformLogo />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#programs" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.programs')}</a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.features')}</a>
              <Link to="/verify-diploma" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.verifyDiploma')}</Link>
              <LanguageSwitcher />
              <Link to="/auth">
                <Button>{t('common.signIn')}</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher variant="compact" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-b border-border animate-fade-in">
            <div className="px-4 py-4 space-y-3">
              <a href="#programs" className="block text-muted-foreground hover:text-foreground transition-colors py-2">{t('nav.programs')}</a>
              <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors py-2">{t('nav.features')}</a>
              <Link to="/verify-diploma" className="block text-muted-foreground hover:text-foreground transition-colors py-2">{t('nav.verifyDiploma')}</Link>
              <Link to="/auth" className="block">
                <Button className="w-full">{t('common.signIn')}</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 gradient-hero overflow-hidden">
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 pointer-events-none" />
        
        {/* Ambient background glow elements */}
        <div className="absolute top-1/4 -start-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -end-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Hero Texts & CTAs */}
            <div className="lg:col-span-7 text-center lg:text-start rtl:lg:text-right space-y-6">
              {/* Badge Tagline */}
              {heroBadge && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-white text-xs sm:text-sm font-semibold shadow-sm animate-fade-in">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
                  </span>
                  <span>{heroBadge}</span>
                </div>
              )}

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] animate-fade-in">
                {heroTitle}
                <span className="block text-accent mt-2 drop-shadow-md font-black">
                  {heroTitleAccent}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in font-normal" style={{ animationDelay: '0.1s' }}>
                {heroSubtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in pt-2" style={{ animationDelay: '0.2s' }}>
                {renderCtaButton(heroCtaPrimaryText, heroCtaPrimaryLink, 'hero', t('home.getStarted'), '/auth')}
                {renderCtaButton(heroCtaSecondaryText, heroCtaSecondaryLink, 'hero-outline', t('home.explorePrograms'), '#programs')}
              </div>

              {/* Trust badges / Features strip */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-white/85 pt-4 border-t border-white/15 animate-fade-in" style={{ animationDelay: '0.25s' }}>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-amber-300 shrink-0" />
                  شهادات معتمدة رسمياً
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-amber-300 shrink-0" />
                  تطبيق عملي وتقني 100%
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-amber-300 shrink-0" />
                  فرص تدريب وشراكات مهنية
                </span>
              </div>
            </div>

            {/* Right Column: Simply University Hero Image Showcase */}
            <div className="lg:col-span-5 relative animate-fade-in mt-6 lg:mt-0" style={{ animationDelay: '0.25s' }}>
              {/* Ambient Glow */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-accent/50 to-pink-500/40 rounded-3xl blur-2xl opacity-75 -z-10" />

              {/* Main Image Frame */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black/30 backdrop-blur-sm group">
                <img
                  src={heroImageUrl || '/simply_university_hero.jpg'}
                  alt="SIMPLY University Campus & Students"
                  className="w-full h-[360px] sm:h-[430px] object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/simply_university_hero.jpg';
                  }}
                />

                {/* Subtle dark gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

                {/* Floating Chip 1: Top Start */}
                <div className="absolute top-4 start-4 bg-card/95 dark:bg-card/95 text-foreground backdrop-blur-md rounded-2xl p-3 shadow-xl border border-border/70 flex items-center gap-3">
                  <div className="p-2.5 bg-primary/15 text-primary rounded-xl shrink-0">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">SIMPLY UNIVERSITY</p>
                    <p className="text-[10px] text-muted-foreground">حرم جامعي تقني متطور</p>
                  </div>
                </div>

                {/* Floating Chip 2: Bottom End */}
                <div className="absolute bottom-4 end-4 bg-card/95 dark:bg-card/95 text-foreground backdrop-blur-md rounded-2xl p-3 shadow-xl border border-border/70 flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">95% معدل التوظيف</p>
                    <p className="text-[10px] text-muted-foreground">+2500 خريج معتمد</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Stats Counters Grid */}
          <div className="mt-16 lg:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            {dynamicStats.map((stat, i) => (
              <div 
                key={i} 
                className="p-5 sm:p-6 rounded-2xl bg-white/10 dark:bg-black/25 backdrop-blur-md border border-white/15 text-center shadow-lg hover:bg-white/15 transition-all duration-300 hover:-translate-y-0.5"
              >
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-accent drop-shadow-sm tracking-tight">{stat.value}</p>
                <p className="text-xs sm:text-sm text-white/90 font-medium mt-1.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t('home.ourPrograms')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('home.ourProgramsDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {programs.map((program) => (
              <div key={program.name} className="bg-card rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{program.name}</h3>
                    <p className="text-sm text-accent font-medium">{program.duration}</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">{program.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{t('programs.specialties')}:</p>
                  <div className="flex flex-wrap gap-2">
                    {program.specialties.map((specialty) => (
                      <span key={specialty} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t('home.whyChooseUs')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('home.whyChooseUsDesc')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-card rounded-xl p-6 shadow-md border border-border text-center hover:shadow-lg transition-all duration-300">
                <div className="inline-flex p-4 bg-accent/10 rounded-2xl mb-4">
                  <feature.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight">
            {ctaTitle}
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed font-normal">
            {ctaSubtitle}
          </p>
          <Link to="/auth">
            <Button variant="hero" size="xl" className="shadow-2xl">
              {ctaButtonText} <ArrowRight className="ml-2 h-5 w-5 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <PlatformLogo iconClassName="h-8 w-8 text-sidebar-primary" textClassName="text-xl font-bold text-sidebar-foreground" />
              </div>
              <p className="text-sm text-sidebar-foreground/70">
                {t('home.heroSubtitle').substring(0, 80)}...
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t('home.quickLinks')}</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><a href="#programs" className="hover:text-sidebar-foreground transition-colors">{t('nav.programs')}</a></li>
                <li><a href="#features" className="hover:text-sidebar-foreground transition-colors">{t('nav.features')}</a></li>
                <li><Link to="/verify-diploma" className="hover:text-sidebar-foreground transition-colors">{t('nav.verifyDiploma')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('home.portals')}</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><Link to="/login" className="hover:text-sidebar-foreground transition-colors">{t('home.studentPortal')}</Link></li>
                <li><Link to="/login" className="hover:text-sidebar-foreground transition-colors">{t('home.teacherPortal')}</Link></li>
                <li><Link to="/login" className="hover:text-sidebar-foreground transition-colors">{t('home.adminPortal')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('home.languages')}</h4>
              <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
                <Globe className="h-4 w-4" />
                <span>العربية | Français | English</span>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-sidebar-border text-center text-sm text-sidebar-foreground/60">
            © 2024 Simply University. {t('home.allRightsReserved')}
          </div>
        </div>
      </footer>
    </div>
  );
}
