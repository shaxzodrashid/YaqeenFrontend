import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { tokenStore, api } from '../services/api';
import type { Department } from '../services/api';
import { usePermissions } from '../context/PermissionsContext';
import { Sidebar } from './Sidebar';
import { YaqeenHorizontalLogo } from './icons/YaqeenIcons';
import type { PageId } from './Sidebar';
import { OverviewPage } from './OverviewPage';
import { EmployeesPage } from './EmployeesPage';
import { ClientsPage } from './ClientsPage';
import { DepartmentsPage } from './DepartmentsPage';
import { EmployeeProfilePage } from './EmployeeProfilePage';
import { CargoKpiPage } from './cargo/CargoKpiPage';
import { FinancePage } from './finance/FinancePage';
import { RolesPage } from './roles/RolesPage';
import { TasksPage } from './tasks/TasksPage';
import { CommercialOffersPage } from './commercial/CommercialOffersPage';

interface DashboardProps {
  userPhone: string;
  authMethod: string;
  onLogout: () => void;
}

const pageTransition = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

const pageModuleMap: Record<string, string> = {
  employees: 'employees',
  clients: 'clients',
  departments: 'departments',
  cargo: 'cargo_kpi',
  finance: 'finance',
  roles: 'roles',
  tasks: 'tasks',
  commercial: 'commercial_offers',
};

export function Dashboard({
  userPhone: _userPhone,
  authMethod: _authMethod,
  onLogout,
}: DashboardProps) {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { canRead } = usePermissions();
  const user = tokenStore.getUser();

  const isAdmin = user?.role === 'CEO' || user?.role === 'ROP';

  // Guard page navigation if permission missing
  useEffect(() => {
    const mod = pageModuleMap[currentPage];
    if (mod && !canRead(mod)) {
      setCurrentPage('overview');
    }
  }, [currentPage, canRead]);

  // Fetch departments list globally on load to share with pages
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const list = await api.departments.list();
        setDepartments(list);
      } catch {
        // Non-critical
      }
    };
    fetchDepts();
  }, []);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'commercial':
        return <CommercialOffersPage />;
      case 'tasks':
        return <TasksPage />;
      case 'employees':
        return <EmployeesPage />;
      case 'clients':
        return <ClientsPage />;
      case 'departments':
        return <DepartmentsPage />;
      case 'cargo':
        return <CargoKpiPage />;
      case 'finance':
        return <FinancePage />;
      case 'roles':
        return <RolesPage />;
      case 'profile':
        return <EmployeeProfilePage departments={departments} />;
      case 'overview':
      default:
        return <OverviewPage isAdmin={isAdmin} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex w-full overflow-hidden transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={onLogout}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/40 bg-surface dark:bg-surface sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-border/20 text-foreground hover:bg-border/40 transition-colors focus:outline-none cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="size-5 text-brand-gold" />
            </button>
            <YaqeenHorizontalLogo height={24} markVariant="gold" textVariant="gold" />
          </div>
          <div className="text-xs font-bold text-brand-gold bg-brand-gold/15 px-2.5 py-1 rounded-lg">
            {user?.role || 'EMPLOYEE'}
          </div>
        </div>

        <div className="w-full max-w-[1920px] mx-auto px-5 py-6 md:px-6 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
