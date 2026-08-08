import { useState, useEffect, useCallback, useRef, memo } from 'react';
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
  Check,
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

interface NavItem {
  id: PageId;
  icon: React.ReactNode;
  label: string;
  moduleKey?: string;
  category: 'general' | 'operations' | 'management';
}

const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 72 },
};

/* ── Extracted NavLink component to prevent unmount/remount on re-renders ── */
const NavLink = memo(function NavLink({
  item,
  isActive,
  effectiveCollapsed,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  effectiveCollapsed: boolean;
  onNavigate: (page: PageId) => void;
}) {
  const buttonContent = (
    <button
      onClick={() => onNavigate(item.id)}
      className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none relative overflow-hidden ${
        isActive
          ? 'bg-brand-gold/15 text-brand-gold dark:text-brand-gold font-semibold'
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
        className={`transition-colors duration-200 shrink-0 ${
          isActive ? 'text-brand-gold' : 'text-neutral-300 group-hover:text-white'
        }`}
      >
        {item.icon}
      </span>
      <AnimatePresence initial={false}>
        {!effectiveCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0 text-left"
          >
            <T text={item.label} className="truncate" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  if (effectiveCollapsed) {
    return (
      <Tooltip delay={150} closeDelay={0}>
        <Tooltip.Trigger>{buttonContent}</Tooltip.Trigger>
        <Tooltip.Content placement="right">
          <T text={item.label} />
        </Tooltip.Content>
      </Tooltip>
    );
  }

  return buttonContent;
});

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
  const langRef = useRef<HTMLDivElement>(null);

  // Close language menu on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLangOpen(false);
      }
    };

    if (isLangOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLangOpen]);

  // Close language menu when sidebar collapse state changes
  useEffect(() => {
    setIsLangOpen(false);
  }, [collapsed]);

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
    const newMobile = w < 768;
    const newTablet = w >= 768 && w < 1024;
    setIsMobile((prev) => (prev !== newMobile ? newMobile : prev));
    setIsTablet((prev) => (prev !== newTablet ? newTablet : prev));
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
  const handleNavigate = useCallback(
    (page: PageId) => {
      onNavigate(page);
      if (isMobile && onMobileClose) {
        onMobileClose();
      }
    },
    [onNavigate, isMobile, onMobileClose]
  );

  const allNavItems: NavItem[] = [
    {
      id: 'overview',
      icon: <LayoutDashboard className="size-5 shrink-0" />,
      label: t('navOverview'),
      category: 'general',
    },
    {
      id: 'commercial',
      icon: <FileText className="size-5 shrink-0" />,
      label: t('navCommercialOffers'),
      moduleKey: 'commercial_offers',
      category: 'operations',
    },
    {
      id: 'tasks',
      icon: <CheckSquare className="size-5 shrink-0" />,
      label: t('navTasks'),
      moduleKey: 'tasks',
      category: 'operations',
    },
    {
      id: 'finance',
      icon: <DollarSign className="size-5 shrink-0" />,
      label: t('navFinance'),
      moduleKey: 'finance',
      category: 'operations',
    },
    {
      id: 'cargo',
      icon: <Package className="size-5 shrink-0" />,
      label: t('navCargoKpi'),
      moduleKey: 'cargo_kpi',
      category: 'operations',
    },
    {
      id: 'roles',
      icon: <ShieldCheck className="size-5 shrink-0" />,
      label: t('navRoles'),
      moduleKey: 'roles',
      category: 'management',
    },
    {
      id: 'employees',
      icon: <Users className="size-5 shrink-0" />,
      label: t('navEmployees'),
      moduleKey: 'employees',
      category: 'management',
    },
    {
      id: 'clients',
      icon: <UserCheck className="size-5 shrink-0" />,
      label: t('navClients'),
      moduleKey: 'clients',
      category: 'management',
    },
    {
      id: 'departments',
      icon: <Building2 className="size-5 shrink-0" />,
      label: t('navDepartments'),
      moduleKey: 'departments',
      category: 'management',
    },
  ];

  const navItems = allNavItems.filter((item) => !item.moduleKey || canRead(item.moduleKey));

  // Determine effective collapsed state — on mobile overlay, always show expanded
  const effectiveCollapsed = isMobile ? false : collapsed;

  const categories = [
    { key: 'general', title: 'Main' },
    { key: 'operations', title: 'Operations' },
    { key: 'management', title: 'Management' },
  ] as const;

  const sections = categories
    .map((cat) => ({
      ...cat,
      items: navItems.filter((item) => item.category === cat.key),
    }))
    .filter((sec) => sec.items.length > 0);

  /* ── Sidebar content (shared between desktop & mobile overlay) ── */
  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-brand-royal/30 shrink-0">
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
          <div className="size-9 rounded-xl bg-brand-gold/15 flex items-center justify-center border border-brand-gold/30 shrink-0 mx-auto">
            <YaqeenMark size={22} variant="gold" />
          </div>
        )}
      </div>

      {/* Navigation Links grouped into consistent sections */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-3 overflow-y-auto">
        {sections.map((sec, secIdx) => (
          <div key={sec.key} className="flex flex-col gap-1">
            {!effectiveCollapsed ? (
              <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400/60 select-none">
                {sec.title}
              </div>
            ) : (
              secIdx > 0 && <div className="my-1 mx-2 border-t border-brand-royal/20" />
            )}

            {sec.items.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                isActive={currentPage === item.id}
                effectiveCollapsed={effectiveCollapsed}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom Controls */}
      <div className="px-3 py-3 border-t border-brand-royal/30 flex flex-col gap-2 shrink-0">
        {/* Theme & Language Controls */}
        <div className={`flex items-center ${effectiveCollapsed ? 'flex-col gap-2' : 'gap-2'}`}>
          {/* Theme Toggle */}
          {effectiveCollapsed ? (
            <Tooltip delay={150} closeDelay={0}>
              <Tooltip.Trigger>
                <button
                  onClick={(e) => toggleTheme(e)}
                  className="p-2 rounded-xl bg-brand-royal/30 border border-brand-royal/40 text-brand-gold hover:bg-brand-royal/50 transition-all duration-200 cursor-pointer focus:outline-none flex items-center justify-center size-9"
                >
                  {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="right">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Tooltip.Content>
            </Tooltip>
          ) : (
            <button
              onClick={(e) => toggleTheme(e)}
              className="flex items-center gap-2 flex-1 px-3 py-2 bg-brand-royal/30 border border-brand-royal/40 rounded-xl text-[11px] font-medium text-neutral-300 hover:bg-brand-royal/50 transition-all duration-200 cursor-pointer focus:outline-none"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="size-4 text-brand-gold shrink-0" />
                  <span className="truncate">Light</span>
                </>
              ) : (
                <>
                  <Moon className="size-4 text-brand-gold shrink-0" />
                  <span className="truncate">Dark</span>
                </>
              )}
            </button>
          )}

          {/* Language Selector */}
          <div className={`relative ${effectiveCollapsed ? '' : 'flex-1'}`} ref={langRef}>
            {effectiveCollapsed ? (
              <Tooltip delay={150} closeDelay={0} isDisabled={isLangOpen}>
                <Tooltip.Trigger>
                  <button
                    onClick={() => setIsLangOpen((prev) => !prev)}
                    aria-label="Select language"
                    className={`p-2 rounded-xl bg-brand-royal/30 border border-brand-royal/40 text-brand-gold hover:bg-brand-royal/50 transition-all duration-200 cursor-pointer focus:outline-none flex items-center justify-center size-9 relative ${
                      isLangOpen ? 'ring-2 ring-brand-gold/50 bg-brand-royal/50' : ''
                    }`}
                  >
                    <Globe className="size-4" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content placement="right">
                  {locale === 'uz' ? "O'zbek" : locale === 'ru' ? 'Русский' : 'English'}
                </Tooltip.Content>
              </Tooltip>
            ) : (
              <button
                onClick={() => setIsLangOpen((prev) => !prev)}
                className="flex items-center gap-2 w-full px-3 py-2 bg-brand-royal/30 border border-brand-royal/40 rounded-xl text-[11px] font-medium text-neutral-300 hover:bg-brand-royal/50 transition-all duration-200 cursor-pointer focus:outline-none"
              >
                <Globe className="size-4 text-brand-gold shrink-0" />
                <span className="truncate">
                  {locale === 'uz' ? "O'zbek" : locale === 'ru' ? 'Русский' : 'English'}
                </span>
                <ChevronDown
                  className={`size-3.5 ml-auto transition-transform duration-200 shrink-0 ${isLangOpen ? 'rotate-180' : ''}`}
                />
              </button>
            )}

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={
                    effectiveCollapsed
                      ? { opacity: 0, x: -8, scale: 0.95 }
                      : { opacity: 0, y: 4, scale: 0.95 }
                  }
                  animate={
                    effectiveCollapsed
                      ? { opacity: 1, x: 0, scale: 1 }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  exit={
                    effectiveCollapsed
                      ? { opacity: 0, x: -8, scale: 0.95 }
                      : { opacity: 0, y: 4, scale: 0.95 }
                  }
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={`absolute rounded-xl border border-brand-royal/40 bg-brand-navy dark:bg-night-sidebar shadow-2xl z-50 py-1 overflow-hidden backdrop-blur-md ${
                    effectiveCollapsed
                      ? 'left-full bottom-0 ml-2.5 w-36'
                      : 'bottom-full mb-1 left-0 right-0'
                  }`}
                >
                  {(['uz', 'ru', 'en'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLocale(lang);
                        setIsLangOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-none ${
                        locale === lang
                          ? 'bg-brand-gold/15 text-brand-gold font-extrabold'
                          : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {locale === lang && <Check className="size-3 text-brand-gold shrink-0" />}
                        <span>
                          {lang === 'uz' ? "O'zbek" : lang === 'ru' ? 'Русский' : 'English'}
                        </span>
                      </span>
                      <span className="text-[9px] opacity-60 ml-2">{lang.toUpperCase()}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* User Profile Box & Logout */}
        <div
          onClick={() => handleNavigate('profile')}
          className={`group flex items-center ${effectiveCollapsed ? 'flex-col justify-center' : ''} gap-2 p-2 rounded-xl transition-colors duration-200 cursor-pointer relative ${
            currentPage === 'profile'
              ? 'bg-brand-gold/15 border border-brand-gold/40 text-brand-gold font-semibold'
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

          {effectiveCollapsed ? (
            <Tooltip delay={150} closeDelay={0}>
              <Tooltip.Trigger>
                <Avatar className="size-9 border border-brand-gold/30 bg-brand-royal text-brand-gold shrink-0 group-hover:scale-105 transition-transform">
                  {profile?.picture_url && (
                    <Avatar.Image src={getImageUrl(profile.picture_url)} alt={displayName} />
                  )}
                  <Avatar.Fallback className="text-xs font-bold">{userInitials}</Avatar.Fallback>
                </Avatar>
              </Tooltip.Trigger>
              <Tooltip.Content placement="right">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-xs">{displayName}</span>
                  <span className="text-[10px] text-brand-gold">
                    <T k="navMyProfile" />
                  </span>
                </div>
              </Tooltip.Content>
            </Tooltip>
          ) : (
            <Avatar className="size-9 border border-brand-gold/30 bg-brand-royal text-brand-gold shrink-0 group-hover:scale-105 transition-transform">
              {profile?.picture_url && (
                <Avatar.Image src={getImageUrl(profile.picture_url)} alt={displayName} />
              )}
              <Avatar.Fallback className="text-xs font-bold">{userInitials}</Avatar.Fallback>
            </Avatar>
          )}

          <AnimatePresence initial={false}>
            {!effectiveCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
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

          {effectiveCollapsed ? (
            <Tooltip delay={150} closeDelay={0}>
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
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all duration-200 cursor-pointer focus:outline-none shrink-0"
            >
              <LogOut className="size-4" />
            </button>
          )}
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
      className="h-screen sticky top-0 flex flex-col bg-brand-navy dark:bg-night-sidebar border-r border-brand-royal/40 dark:border-border select-none shrink-0 z-30"
    >
      {sidebarContent}
    </motion.aside>
  );
}
