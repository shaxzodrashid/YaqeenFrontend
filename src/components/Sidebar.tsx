import { useState, useEffect, useCallback } from 'react';
import { Avatar, Tooltip } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  Package,
  LogOut,
  ChevronLeft,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  X,
  DollarSign,
  ShieldCheck,
  CheckSquare,
  FileText,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { usePermissions } from '../context/PermissionsContext';
import { YaqeenHorizontalLogo, YaqeenMark } from './icons/YaqeenIcons';
import { T } from './T';
import { api, getImageUrl } from '../services/api';
import type { AuthUser, Employee } from '../services/api';

export type PageId =
  | 'overview'
  | 'commercial'
  | 'employees'
  | 'clients'
  | 'departments'
  | 'profile'
  | 'cargo'
  | 'finance'
  | 'roles'
  | 'tasks';

interface SidebarProps {
  user: AuthUser | null;
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
  /** Mobile overlay open state — controlled by Dashboard */
  mobileOpen?: boolean;
  /** Callback to close the mobile overlay */
  onMobileClose?: () => void;
}

const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 72 },
};

export function Sidebar({
  user,
  currentPage,
  onNavigate,
  onLogout,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { canRead } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [profile, setProfile] = useState<Employee | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = () => {
      api.employees
        .me()
        .then((data) => {
          if (isMounted && data) {
            setProfile(data);
          }
        })
        .catch(() => {
          // Fallback to AuthUser if call fails
        });
    };

    loadProfile();
    window.addEventListener('yaqeen_profile_updated', loadProfile);
    return () => {
      isMounted = false;
      window.removeEventListener('yaqeen_profile_updated', loadProfile);
    };
  }, []);

  const displayName =
    profile?.first_name || profile?.last_name
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : user?.first_name || user?.last_name
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
        : user?.name
          ? user.name
          : user?.phone_number || 'User';

  const getUserInitials = () => {
    const fn = profile?.first_name || user?.first_name;
    const ln = profile?.last_name || user?.last_name;
    if (fn || ln) {
      const f = fn?.[0] || '';
      const l = ln?.[0] || '';
      return (f + l).toUpperCase() || 'YQ';
    }
    const nameStr = user?.name;
    if (nameStr) {
      const parts = nameStr.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0]?.[0]?.toUpperCase() || 'YQ';
    }
    return 'YQ';
  };

  const userInitials = getUserInitials();

  // ── Responsive: detect screen size ────────────────────
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false
  );

  const handleResize = useCallback(() => {
    const w = window.innerWidth;
    setIsMobile(w < 768);
    setIsTablet(w >= 768 && w < 1024);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Auto-collapse on tablet
  useEffect(() => {
    if (isTablet) setCollapsed(true);
  }, [isTablet]);

  // Close mobile sidebar on navigation
  const handleNavigate = (page: PageId) => {
    onNavigate(page);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const allNavItems: { id: PageId; icon: React.ReactNode; label: string; moduleKey?: string }[] = [
    {
      id: 'overview',
      icon: <LayoutDashboard className="size-5 shrink-0" />,
      label: t('navOverview'),
    },
    {
      id: 'commercial',
      icon: <FileText className="size-5 shrink-0 text-amber-500/90 dark:text-brand-gold" />,
      label: t('navCommercialOffers'),
      moduleKey: 'commercial_offers',
    },
    {
      id: 'tasks',
      icon: <CheckSquare className="size-5 shrink-0 text-amber-500/90 dark:text-brand-gold" />,
      label: t('navTasks'),
      moduleKey: 'tasks',
    },
    {
      id: 'finance',
      icon: <DollarSign className="size-5 shrink-0 text-amber-500/90 dark:text-brand-gold" />,
      label: t('navFinance'),
      moduleKey: 'finance',
    },
    {
      id: 'cargo',
      icon: <Package className="size-5 shrink-0" />,
      label: t('navCargoKpi'),
      moduleKey: 'cargo_kpi',
    },
    {
      id: 'roles',
      icon: <ShieldCheck className="size-5 shrink-0 text-amber-500/90 dark:text-brand-gold" />,
      label: t('navRoles'),
      moduleKey: 'roles',
    },
    {
      id: 'employees',
      icon: <Users className="size-5 shrink-0" />,
      label: t('navEmployees'),
      moduleKey: 'employees',
    },
    {
      id: 'clients',
      icon: <UserCheck className="size-5 shrink-0" />,
      label: t('navClients'),
      moduleKey: 'clients',
    },
    {
      id: 'departments',
      icon: <Building2 className="size-5 shrink-0" />,
      label: t('navDepartments'),
      moduleKey: 'departments',
    },
  ];

  const navItems = allNavItems.filter((item) => !item.moduleKey || canRead(item.moduleKey));

  // Determine effective collapsed state — on mobile overlay, always show expanded
  const effectiveCollapsed = isMobile ? false : collapsed;

  const NavLink = ({ item }: { item: (typeof navItems)[number] }) => {
    const isActive = currentPage === item.id;
    return (
      <Tooltip delay={0} closeDelay={0}>
        <Tooltip.Trigger>
          <button
            onClick={() => handleNavigate(item.id)}
            className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none relative overflow-hidden
              ${
                isActive
                  ? 'bg-brand-gold/15 text-brand-gold dark:text-brand-gold'
                  : 'text-neutral-300 dark:text-neutral-300 hover:bg-white/5 hover:text-white'
              }`}
          >
            {/* Active indicator bar */}
            {isActive && (
              <motion.div
                layoutId="sidebar-active-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-gold rounded-r-full"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span
              className={`transition-colors duration-200 ${isActive ? 'text-brand-gold' : 'text-neutral-300 group-hover:text-white'}`}
            >
              {item.icon}
            </span>
            <AnimatePresence initial={false}>
              {!effectiveCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0 text-left"
                >
                  <T text={item.label} className="truncate" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </Tooltip.Trigger>
        {effectiveCollapsed && (
          <Tooltip.Content placement="right">
            <T text={item.label} />
          </Tooltip.Content>
        )}
      </Tooltip>
    );
  };

  /* ── Sidebar content (shared between desktop & mobile overlay) ── */
  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-brand-royal/30">
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus:outline-none mr-1"
          >
            <X className="size-5" />
          </button>
        )}
        {!effectiveCollapsed ? (
          <YaqeenHorizontalLogo
            height={30}
            markVariant="gold"
            textVariant="gold"
            className="transition-all duration-300"
          />
        ) : (
          <div className="size-9 rounded-xl bg-brand-gold/15 flex items-center justify-center border border-brand-gold/30 shrink-0">
            <YaqeenMark size={22} variant="gold" />
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.id} item={item} />
        ))}
      </nav>

      {/* Bottom Controls */}
      <div className="px-3 py-3 border-t border-brand-royal/30 flex flex-col gap-2">
        {/* Theme & Language Controls */}
        <div className={`flex items-center ${effectiveCollapsed ? 'flex-col gap-2' : 'gap-2'}`}>
          {/* Theme Toggle */}
          <Tooltip delay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button
                onClick={(e) => toggleTheme(e)}
                className="p-2 rounded-lg bg-brand-royal/30 border border-brand-royal/40 text-brand-gold hover:bg-brand-royal/50 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content placement="right">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Tooltip.Content>
          </Tooltip>

          {/* Language Selector */}
          {!effectiveCollapsed && (
            <div className="relative flex-1">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 w-full px-2.5 py-2 bg-brand-royal/30 border border-brand-royal/40 rounded-lg text-[10px] font-bold uppercase tracking-wider text-neutral-300 hover:bg-brand-royal/50 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                <Globe className="size-3.5 text-brand-gold shrink-0" />
                <span>{locale === 'uz' ? "O'zbek" : locale === 'ru' ? 'Русский' : 'English'}</span>
                <ChevronDown
                  className={`size-3 ml-auto transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                    className="absolute bottom-full mb-1 left-0 right-0 rounded-lg border border-brand-royal/40 bg-brand-navy dark:bg-night-sidebar shadow-xl z-50 py-1 overflow-hidden"
                  >
                    {(['uz', 'ru', 'en'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLocale(lang);
                          setIsLangOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-none
                          ${
                            locale === lang
                              ? 'bg-brand-gold/15 text-brand-gold'
                              : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <span>
                          {lang === 'uz' ? "O'zbek" : lang === 'ru' ? 'Русский' : 'English'}
                        </span>
                        <span className="text-[9px] opacity-60">{lang.toUpperCase()}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* User Profile Box & Logout */}
        <div
          onClick={() => handleNavigate('profile')}
          className={`group flex items-center ${effectiveCollapsed ? 'flex-col justify-center' : ''} gap-2 p-2 rounded-xl transition-all duration-200 cursor-pointer relative ${
            currentPage === 'profile'
              ? 'bg-brand-gold/15 border border-brand-gold/40 text-brand-gold'
              : 'hover:bg-white/5 border border-transparent text-neutral-300'
          }`}
        >
          {currentPage === 'profile' && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-gold rounded-r-full"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}

          <Tooltip delay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <Avatar className="size-9 border border-brand-gold/30 bg-brand-royal text-brand-gold shrink-0 group-hover:scale-105 transition-transform">
                {profile?.picture_url && (
                  <Avatar.Image src={getImageUrl(profile.picture_url)} alt={displayName} />
                )}
                <Avatar.Fallback className="text-xs font-bold">{userInitials}</Avatar.Fallback>
              </Avatar>
            </Tooltip.Trigger>
            {effectiveCollapsed && (
              <Tooltip.Content placement="right">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-xs">{displayName}</span>
                  <span className="text-[10px] text-brand-gold">
                    <T k="navMyProfile" />
                  </span>
                </div>
              </Tooltip.Content>
            )}
          </Tooltip>

          <AnimatePresence initial={false}>
            {!effectiveCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex-1 min-w-0 overflow-hidden flex flex-col"
              >
                <p className="text-xs font-semibold text-white truncate group-hover:text-brand-gold transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] text-brand-gold font-medium truncate">
                  {user?.role || 'EMPLOYEE'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Tooltip delay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all duration-200 cursor-pointer focus:outline-none shrink-0"
              >
                <LogOut className="size-4" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content placement="right">
              <T k="logout" />
            </Tooltip.Content>
          </Tooltip>
        </div>

        {/* Collapse Toggle — hidden on mobile (sidebar is overlay there) */}
        {!isMobile && (
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setIsLangOpen(false);
            }}
            className="flex items-center justify-center gap-2 w-full py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300/60 hover:text-neutral-300 transition-colors cursor-pointer focus:outline-none"
          >
            <ChevronLeft
              className={`size-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            />
            {!collapsed && (
              <span>
                <T k="navCollapse" />
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );

  /* ── Mobile: render as overlay drawer ──────────────────── */
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onMobileClose}
            />
            {/* Slide-in sidebar drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-screen w-[280px] flex flex-col bg-brand-navy dark:bg-night-sidebar border-r border-brand-royal/40 dark:border-border select-none overflow-hidden z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  /* ── Desktop/Tablet: render as sticky sidebar ─────────── */
  return (
    <motion.aside
      variants={sidebarVariants}
      animate={effectiveCollapsed ? 'collapsed' : 'expanded'}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-screen sticky top-0 flex flex-col bg-brand-navy dark:bg-night-sidebar border-r border-brand-royal/40 dark:border-border select-none overflow-hidden shrink-0 z-30"
    >
      {sidebarContent}
    </motion.aside>
  );
}
