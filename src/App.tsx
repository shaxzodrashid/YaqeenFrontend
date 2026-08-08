import { useState, useEffect, useRef } from 'react';
import { AuthCard } from './components/AuthCard';
import { Dashboard } from './components/Dashboard';
import { ShieldCheck, Calendar, Sun, Moon, Globe, ChevronDown } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { api, tokenStore } from './services/api';
import { YaqeenStackedLogo } from './components/icons/YaqeenIcons';
import { AnimatePresence, motion } from 'framer-motion';
import { T } from './components/T';

const quotes = [
  { text: "A visual language of clarity and confidence—rooted in heritage, designed for today.", tagline: "Our Mission" },
  { text: "Yaqeen communicates certainty, confidence, calm, and trust in every interaction.", tagline: "Core attribute" },
  { text: "Premium quality comes from precision, not visual excess.", tagline: "Design Principle" },
  { text: "Calm rather than cold. Trustworthy rather than corporate.", tagline: "Brand Essence" }
];

function AppContent() {
  const { t, locale, setLocale } = useTranslation();
  const { showNotification } = useNotification();
  const { theme, toggleTheme } = useTheme();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [authMethod, setAuthMethod] = useState('');

  // Quotes rotation
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  // Language selector state
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Verify token on mount (Auto-login)
  useEffect(() => {
    const accessToken = tokenStore.getAccessToken();
    const user = tokenStore.getUser();
    if (accessToken && user) {
      setUserPhone(user.phone_number);
      setAuthMethod('password'); // Session restored
      setIsAuthenticated(true);
    }
  }, []);

  // Quotes slider rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFadeState('in');
      }, 500);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  // Check if unauthenticated event fires from API response interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setUserPhone('');
      setAuthMethod('');
      showNotification(t('invalid_refresh_token'), 'warning');
    };
    window.addEventListener('yaqeen_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('yaqeen_unauthorized', handleUnauthorized);
  }, [showNotification, t]);

  // Close language dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAuthSuccess = (phone: string, method: string) => {
    setUserPhone(phone);
    setAuthMethod(method);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    tokenStore.clear();
    setIsAuthenticated(false);
    setUserPhone('');
    setAuthMethod('');
  };


  if (isAuthenticated) {
    return (
      <Dashboard 
        userPhone={userPhone} 
        authMethod={authMethod} 
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <div className={`${theme} min-h-screen flex w-full bg-[#FDFBF7] dark:bg-background text-[#2D3238] dark:text-foreground transition-colors duration-300 font-ui`} data-theme={theme}>
      
      {/* LEFT SIDE: Brand Cover Panel (hidden on mobile, visible on desktop) */}
      <section 
        className="hidden md:flex md:w-[38%] bg-[#F5EFEB] dark:bg-night-sidebar flex-col justify-between p-10 relative overflow-hidden select-none transition-colors duration-300 border-r border-neutral-200/40 dark:border-border"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(197, 168, 110, 0.15) 1.5px, transparent 0)',
          backgroundSize: '28px 28px'
        }}
      >
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#C5A86E]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center gap-2.5 z-10">
          <ShieldCheck className="size-5.5 text-[#C5A86E] dark:text-[#C8A96A]" />
          <span className="text-[10px] font-bold tracking-widest text-[#A88C52] dark:text-brand-gold uppercase">Yaqeen Shield Protected</span>
        </div>

        {/* Center Logo & Quotes */}
        <div className="flex flex-col items-center justify-center flex-1 py-12 z-10">
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <YaqeenStackedLogo size={130} variant={theme === 'dark' ? 'gold' : 'navy'} />
          </div>

          {/* Quotes slider */}
          <div className="w-full max-w-sm text-center min-h-[120px] flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-[#A88C52] dark:text-brand-gold tracking-widest uppercase mb-3 bg-[#EAE1DA] dark:bg-default px-2.5 py-0.5 rounded-full border border-[#C5A86E]/20 dark:border-brand-gold/20">
              {quotes[currentQuoteIndex].tagline}
            </span>
            <p 
              className={`text-base font-serif text-[#2D3238] dark:text-neutral-ivory leading-relaxed transition-opacity duration-500 italic
                ${fadeState === 'in' ? 'opacity-90' : 'opacity-0'}`}
            >
              "{quotes[currentQuoteIndex].text}"
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col gap-2 z-10 text-left border-t border-neutral-200/60 dark:border-border pt-4">
          <p className="text-[10px] text-[#6B7280] dark:text-muted">
            <T k="copyright" />
          </p>
          <div className="flex items-center gap-1.5 text-[9px] text-[#6B7280] dark:text-muted font-bold uppercase tracking-wider">
            <Calendar className="size-3 text-[#C5A86E] dark:text-[#C8A96A]" />
            <span><T k="updatedDate" /></span>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE: Auth Form Panel */}
      <section className="flex-1 flex flex-col justify-between items-center p-6 relative overflow-y-auto min-h-screen bg-[#FDFBF7] dark:bg-background transition-colors duration-300">
        
        {/* Floating controls in top right */}
        <div className="w-full flex justify-between sm:justify-end items-center gap-3.5 z-20 max-w-md select-none mt-2">
          {/* Theme switcher */}
          <button
            onClick={(e) => toggleTheme(e)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100/80 dark:bg-surface/80 hover:bg-neutral-200/40 dark:hover:bg-night-elevated border border-neutral-200 dark:border-border text-[10px] font-bold uppercase tracking-wider text-[#2D3238] dark:text-neutral-ivory rounded-xl transition-all duration-200 cursor-pointer select-none focus:outline-none"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="size-3.5 text-brand-gold shrink-0" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="size-3.5 text-brand-navy shrink-0" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            {/* Lang selector dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100/80 dark:bg-surface/80 hover:bg-neutral-200/40 dark:hover:bg-night-elevated border border-neutral-200 dark:border-border text-[10px] font-bold uppercase tracking-wider text-[#2D3238] dark:text-neutral-ivory rounded-xl transition-all duration-200 cursor-pointer select-none focus:outline-none"
              >
                <Globe className="size-3.5 text-[#C5A86E] dark:text-[#C8A96A]" />
                <span>{locale}</span>
                <ChevronDown className={`size-3 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''} text-[#6B7280] dark:text-muted`} />
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-1.5 w-28 rounded-xl border border-neutral-200/60 dark:border-border bg-white dark:bg-overlay shadow-lg z-50 py-1 overflow-hidden"
                  >
                    {(['uz', 'ru', 'en'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLocale(lang);
                          setIsLangOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-neutral-50 dark:hover:bg-night-elevated cursor-pointer focus:outline-none
                          ${locale === lang 
                            ? 'bg-[#F2ECE1]/50 dark:bg-default text-[#A88C52] dark:text-brand-gold font-extrabold' 
                            : 'text-[#2D3238] dark:text-neutral-ivory'}`}
                      >
                        <span>{lang === 'uz' ? 'Oʻzbek' : lang === 'ru' ? 'Русский' : 'English'}</span>
                        <span className="text-[9px] text-[#6B7280] dark:text-muted">{lang}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Subtle background circles for depth */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#C5A86E]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#7C8D76]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Auth form center content */}
        <div className="w-full flex flex-col justify-center items-center flex-1 py-8 z-10">
          <AuthCard onSuccess={handleAuthSuccess} />
        </div>

        {/* Small mobile copyright */}
        <div className="md:hidden text-[9px] text-[#6B7280] dark:text-muted select-none pb-2 z-10">
          {t('copyright')}
        </div>

      </section>

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <PermissionsProvider>
            <AppContent />
          </PermissionsProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
