import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Spinner } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Building,
  Phone,
  Palette,
  Paperclip,
  LayoutGrid,
  Table as TableIcon,
  Check,
  Copy,
  X,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePermissions } from '../context/PermissionsContext';
import { api } from '../services/api';
import type { Client, Employee, ClientColorStats, ClientPaginatedResponse } from '../services/api';
import { ClientFormModal } from './ClientFormModal';
import { ClientDrawer } from './ClientDrawer';
import { T } from './T';

// Color preset definitions for filtering swatches
const COLOR_PRESETS = [
  { name: 'Unassigned Gray', hex: '#808080' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#3357FF' },
  { name: 'Green', hex: '#28A745' },
  { name: 'Gold', hex: '#FFC107' },
  { name: 'Purple', hex: '#6F42C1' },
  { name: 'Orange', hex: '#FD7E14' },
  { name: 'Pink', hex: '#E83E8C' },
  { name: 'Teal', hex: '#17A2B8' },
];

/* ── Framer Motion Animation Variants ─────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 320, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export function ClientsPage() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete, canWorkWithAllClients, currentEmployee } =
    usePermissions();
  const canAllClients = canWorkWithAllClients();

  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<ClientColorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);

  // Filter & Search states
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all'
  );

  // View Mode: Grid Cards vs Table View
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals and Drawers
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<'create' | 'edit'>('create');
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClientForDrawer, setSelectedClientForDrawer] = useState<Client | null>(null);

  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 1. Fetch Employees list for dropdown filter & modals
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.employees.list({ limit: 100 });
      setEmployees(res.items || []);
    } catch (err) {
      console.error('Failed to load employees for filter:', err);
    }
  }, []);

  // 2. Fetch Color Distribution Statistics
  const fetchColorStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.clients.getColorDistribution();
      setStats(res);
    } catch (err) {
      console.error('Failed to load color distribution stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 3. Fetch Clients list with filters
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      let is_active: boolean | undefined = undefined;
      if (activeStatusFilter === 'active') is_active = true;
      if (activeStatusFilter === 'inactive') is_active = false;

      const res: ClientPaginatedResponse = await api.clients.list({
        page,
        limit: 12,
        search: searchQuery || undefined,
        assigned_employee_id: selectedEmployeeId || undefined,
        color: selectedColor || undefined,
        is_active,
      });

      setClients(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalClients(res.pagination?.total || 0);
    } catch (err: any) {
      if (err?.location === 'permission_denied_for_other_employees') {
        showNotification(
          t('errorClientOtherEmployee') || 'You can only view and manage clients assigned to you.',
          'error'
        );
      } else if (err?.location === 'user_not_linked_to_employee') {
        showNotification(
          t('errorClientNotLinked') ||
            'Your user account is not linked to an employee profile. Please contact an administrator.',
          'error'
        );
      } else {
        showNotification(err?.message || 'Error fetching client records', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [
    page,
    searchQuery,
    selectedEmployeeId,
    selectedColor,
    activeStatusFilter,
    showNotification,
    t,
  ]);

  // Initial load
  useEffect(() => {
    fetchEmployees();
    fetchColorStats();
  }, [fetchEmployees, fetchColorStats]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Handle Search Input with debounce
  const handleSearchChange = (val: string) => {
    setSearchInputValue(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setSearchQuery(val);
      setPage(1);
    }, 300);
    setSearchTimeout(timeout);
  };

  // Copy Phone helper
  const handleCopyPhone = (e: React.MouseEvent, phoneNum: string, clientId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phoneNum);
    setCopiedPhoneId(clientId);
    showNotification('Phone number copied to clipboard', 'info');
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Click handler for employee filter in stats header
  const handleToggleEmployeeFilter = (employeeId: string | null) => {
    const idStr = employeeId || '';
    if (selectedEmployeeId === idStr) {
      setSelectedEmployeeId('');
    } else {
      setSelectedEmployeeId(idStr);
    }
    setPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInputValue('');
    setSearchQuery('');
    setSelectedEmployeeId('');
    setSelectedColor('');
    setActiveStatusFilter('all');
    setPage(1);
  };

  // Handlers for Client Modal and Drawer
  const handleOpenCreateModal = () => {
    setSelectedClientForEdit(null);
    setFormModalMode('create');
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setSelectedClientForEdit(client);
    setFormModalMode('edit');
    setFormModalOpen(true);
  };

  const handleOpenDrawer = (client: Client) => {
    setSelectedClientForDrawer(client);
    setDrawerOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      await api.clients.delete(clientToDelete.id);
      showNotification('Client deleted successfully', 'success');
      setClientToDelete(null);
      fetchClients();
      fetchColorStats();
    } catch (err: any) {
      if (err?.location === 'permission_denied_for_other_employees') {
        showNotification(
          t('errorClientOtherEmployee') || 'You can only view and manage clients assigned to you.',
          'error'
        );
      } else if (err?.location === 'client_not_found') {
        showNotification(t('errorClientNotFound') || 'Client not found', 'error');
      } else {
        showNotification(err?.message || 'Failed to delete client', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedEmployeeId || selectedColor || activeStatusFilter !== 'all'
  );

  // Active vs Inactive counts from stats or current list fallback
  const totalActiveCount = useMemo(() => {
    if (stats) return stats.total_clients;
    return totalClients;
  }, [stats, totalClients]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Page Header ────────────────────────────────────────── */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/25 pb-5"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold font-serif tracking-tight text-foreground">
              <T k="clientTitle" />
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold font-bold text-xs border border-brand-gold/30">
              {totalClients} {!canAllClients ? t('clientMyAssignedClients') : t('clientTotal')}
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted mt-1">
            <T k="clientSubtitle" />
          </p>
        </div>

        {/* Action Button: Add Client */}
        {canCreate('clients') && (
          <div className="flex items-center gap-3">
            <Button
              onPress={handleOpenCreateModal}
              className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-bold px-5 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
            >
              <Plus className="size-4 mr-1.5" />
              <T k="clientAddNew" />
            </Button>
          </div>
        )}
      </motion.div>

      {/* ── 2. Top Analytics Header: Team Distribution ── */}
      <motion.div variants={headerVariants} initial="hidden" animate="show">
        <div className="p-5 rounded-2xl bg-surface border border-border/30 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            {/* Left: Manager Distribution Bar + Chips */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="size-4 text-brand-gold" />
                  <h3 className="text-sm font-bold text-foreground">
                    {canAllClients ? (
                      <T k="clientTeamDistribution" />
                    ) : (
                      <T k="clientMyAssignedClients" />
                    )}
                  </h3>
                </div>
                {selectedEmployeeId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmployeeId('');
                      setPage(1);
                    }}
                    className="text-[11px] font-semibold text-brand-gold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <X className="size-3" /> <T k="clientClearFilter" />
                  </button>
                )}
              </div>

              {loadingStats ? (
                <div className="flex items-center justify-center py-6">
                  <Spinner size="sm" />
                </div>
              ) : canAllClients && stats && stats.by_employee && stats.by_employee.length > 0 ? (
                <>
                  {/* Stacked Progress Bar (constrained, not full-width stretched) */}
                  <div className="h-3 w-full max-w-2xl rounded-full bg-default-100 dark:bg-default-50/20 overflow-hidden flex shadow-inner">
                    {stats.by_employee.map((emp, index) => {
                      const percent =
                        stats.total_clients > 0 ? (emp.count / stats.total_clients) * 100 : 0;
                      const isSelected = selectedEmployeeId === (emp.employee_id || '');
                      return (
                        <button
                          key={emp.employee_id || `emp-bar-${index}`}
                          type="button"
                          title={`${emp.employee_name}: ${emp.count} clients (${percent.toFixed(1)}%)`}
                          onClick={() => handleToggleEmployeeFilter(emp.employee_id)}
                          style={{
                            width: `${Math.max(percent, 2)}%`,
                            backgroundColor: emp.default_color || '#808080',
                          }}
                          className={`h-full transition-all duration-200 hover:opacity-90 cursor-pointer relative ${
                            isSelected ? 'ring-2 ring-foreground ring-offset-1 z-10' : ''
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Manager Chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    {stats.by_employee.map((emp, index) => {
                      const isSelected = selectedEmployeeId === (emp.employee_id || '');
                      return (
                        <button
                          key={emp.employee_id || `emp-chip-${index}`}
                          type="button"
                          onClick={() => handleToggleEmployeeFilter(emp.employee_id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-foreground text-background border-foreground shadow-sm scale-105'
                              : 'bg-default-100/50 dark:bg-default-50/10 border-border/30 hover:border-border text-foreground'
                          }`}
                        >
                          <span
                            className="size-3 rounded-full shadow-sm shrink-0"
                            style={{ backgroundColor: emp.default_color || '#808080' }}
                          />
                          <span className="truncate max-w-[120px]">{emp.employee_name}</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-default-200/60 dark:bg-default-100/20 text-[10px]">
                            {emp.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : !canAllClients ? (
                <div className="p-3 rounded-xl bg-default-100/50 dark:bg-default-50/10 border border-border/30 flex items-center justify-between max-w-md">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="size-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs"
                      style={{ backgroundColor: currentEmployee?.color || '#808080' }}
                    >
                      {currentEmployee?.first_name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {currentEmployee
                          ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
                          : t('clientMyAssignedClients')}
                      </p>
                      <p className="text-[10px] text-muted">{t('clientAutoAssignedToYou')}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-brand-gold/15 text-brand-gold font-bold text-xs border border-brand-gold/30">
                    {totalActiveCount}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted italic">
                  No manager distribution data available yet.
                </p>
              )}
            </div>

            {/* Right: Summary Stats */}
            {canAllClients && stats && (
              <div className="lg:w-48 shrink-0 flex flex-row lg:flex-col gap-3 lg:border-l lg:border-border/20 lg:pl-5">
                <div className="flex-1 p-3 rounded-xl bg-default-100/50 dark:bg-default-50/10 border border-border/30 text-center">
                  <p className="text-lg font-bold text-foreground">{stats.total_clients}</p>
                  <p className="text-[10px] text-muted font-medium uppercase tracking-wide">
                    <T k="clientTotal" />
                  </p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {totalActiveCount}
                  </p>
                  <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-medium uppercase tracking-wide">
                    <T k="statusActive" />
                  </p>
                </div>
                {stats.by_employee && (
                  <div className="flex-1 p-3 rounded-xl bg-brand-gold/10 border border-brand-gold/20 text-center">
                    <p className="text-lg font-bold text-brand-gold">{stats.by_employee.length}</p>
                    <p className="text-[10px] text-brand-gold/70 font-medium uppercase tracking-wide">
                      <T k="clientAllManagers" />
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 3. Filter & Action Toolbar ─────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-surface border border-border/30 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchInputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('clientSearch') || 'Search by name, company name, or phone...'}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs md:text-sm bg-default-100/50 dark:bg-default-50/10 border border-border/30 text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 transition-all"
            />
            {searchInputValue && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Segment Switch */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Responsible Employee Select (Only if permitted to work with all clients) */}
            {canAllClients && (
              <select
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-default-100/50 dark:bg-default-50/10 border border-border/30 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/40 transition-all cursor-pointer"
              >
                <option value="">{t('clientAllManagers') || 'All Managers'}</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            )}

            {/* Color Swatch Select */}
            <select
              value={selectedColor}
              onChange={(e) => {
                setSelectedColor(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-default-100/50 dark:bg-default-50/10 border border-border/30 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/40 transition-all cursor-pointer font-mono"
            >
              <option value="">All Colors</option>
              {COLOR_PRESETS.map((c) => (
                <option key={c.hex} value={c.hex}>
                  {c.name} ({c.hex})
                </option>
              ))}
            </select>

            {/* Active Status Segment Switch */}
            <div className="flex items-center p-1 rounded-xl bg-default-100/60 dark:bg-default-50/20 border border-border/30">
              <button
                type="button"
                onClick={() => {
                  setActiveStatusFilter('all');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStatusFilter === 'all'
                    ? 'bg-surface text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <T k="tabAll" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveStatusFilter('active');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStatusFilter === 'active'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <T k="statusActive" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveStatusFilter('inactive');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStatusFilter === 'inactive'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <T k="statusInactive" />
              </button>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onPress={handleResetFilters}
                className="text-xs font-semibold text-muted hover:text-foreground"
              >
                <RefreshCw className="size-3.5 mr-1" /> <T k="clientClearFilters" />
              </Button>
            )}

            {/* View Toggle: Grid vs Table */}
            <div className="flex items-center p-1 rounded-xl bg-default-100/60 dark:bg-default-50/20 border border-border/30 ml-auto md:ml-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-brand-gold text-brand-navy shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-brand-gold text-brand-navy shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
                title="Table List View"
              >
                <TableIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Client List Presentation ─────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : clients.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-border/40 bg-surface/50 text-center space-y-3">
          <Building className="size-12 mx-auto text-muted/50" />
          <h3 className="text-lg font-bold text-foreground">
            <T k="clientNoClients" />
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            <T k="clientNoClientsDesc" />
          </p>
          {hasActiveFilters && (
            <Button
              size="sm"
              onPress={handleResetFilters}
              className="bg-brand-gold text-brand-navy font-bold mt-2"
            >
              <T k="clientClearFilters" />
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID CARD VIEW ───────────────────────────────────────── */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {clients.map((client) => {
              const effectiveColor = client.effective_color || '#808080';
              const isAssigned = Boolean(client.assigned_employee);
              const isCopied = copiedPhoneId === client.id;
              const attachmentCount = client.attachments?.length || 0;

              return (
                <motion.div
                  key={client.id}
                  variants={cardVariants}
                  layout
                  onClick={() => handleOpenDrawer(client)}
                  className="group relative rounded-2xl bg-surface border border-border/30 hover:border-brand-gold/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
                >
                  {/* Glowing left color border indicator */}
                  <div
                    className="absolute top-0 bottom-0 left-0 w-1.5 transition-colors duration-300"
                    style={{
                      backgroundColor: effectiveColor,
                      boxShadow: `0 0 10px ${effectiveColor}90`,
                    }}
                  />

                  {/* Card Main Body */}
                  <div className="p-5 pl-6 space-y-4">
                    {/* Top Row: Color badge & Status pill */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Inherited vs Unassigned color tag badge */}
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-default-100 dark:bg-default-50/20 border border-border/30">
                        <span
                          className="size-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: effectiveColor }}
                        />
                        <span>{effectiveColor.toUpperCase()}</span>
                        <span className="text-[9px] text-muted opacity-70">
                          {isAssigned ? <T k="clientInherited" /> : <T k="clientUnassigned" />}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          client.is_active
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {client.is_active ? <T k="statusActive" /> : <T k="statusInactive" />}
                      </span>
                    </div>

                    {/* Client Name & Company Badge */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold font-serif text-foreground group-hover:text-brand-gold transition-colors leading-snug">
                        {client.first_name} {client.last_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted font-semibold">
                        <Building className="size-3.5 text-brand-gold shrink-0" />
                        <span className="truncate">{client.company_name}</span>
                      </div>
                    </div>

                    {/* Phone with Click-to-Copy */}
                    <div
                      onClick={(e) => handleCopyPhone(e, client.phone, client.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-default-100/60 dark:bg-default-50/20 hover:bg-brand-gold/15 hover:text-brand-gold text-xs font-mono font-semibold text-foreground transition-colors group/phone"
                      title="Click to copy phone number"
                    >
                      <Phone className="size-3.5 text-brand-gold shrink-0" />
                      <span>{client.phone}</span>
                      {isCopied ? (
                        <Check className="size-3.5 text-emerald-500 ml-auto" />
                      ) : (
                        <Copy className="size-3.5 opacity-0 group-hover/phone:opacity-100 text-muted transition-opacity ml-auto" />
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Employee Chip & Attachments badge & Actions */}
                  <div className="px-5 py-3 pl-6 border-t border-border/20 bg-default-50/20 flex items-center justify-between gap-2">
                    {/* Assigned Employee chip */}
                    {client.assigned_employee ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs shrink-0"
                          style={{ backgroundColor: client.assigned_employee.color || '#808080' }}
                        >
                          {client.assigned_employee.first_name[0]}
                        </div>
                        <span className="text-xs font-semibold text-muted truncate">
                          {client.assigned_employee.first_name} {client.assigned_employee.last_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted/60 italic font-medium">
                        <T k="clientUnassigned" />
                      </span>
                    )}

                    {/* Right side: Attachment counter & Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Attachment counter badge */}
                      {attachmentCount > 0 && (
                        <div
                          title={`${attachmentCount} Attached Files`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold text-[11px] font-bold"
                        >
                          <Paperclip className="size-3" />
                          <span>{attachmentCount}</span>
                        </div>
                      )}

                      {/* Quick view button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrawer(client);
                        }}
                        className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="size-4" />
                      </button>

                      {/* Quick edit button */}
                      {canUpdate('clients') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(client);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                          title="Edit Client"
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* ── TABLE VIEW ───────────────────────────────────────────── */
        <div className="rounded-2xl bg-surface border border-border/30 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-default-100/60 dark:bg-default-50/20 text-xs font-bold uppercase tracking-wider text-muted border-b border-border/25">
                <th className="px-4 py-3">
                  <T k="clientColColorName" />
                </th>
                <th className="px-4 py-3">
                  <T k="clientCompany" />
                </th>
                <th className="px-4 py-3">
                  <T k="phoneNumber" />
                </th>
                <th className="px-4 py-3">
                  <T k="clientAssignedTo" />
                </th>
                <th className="px-4 py-3">
                  <T k="colStatus" />
                </th>
                <th className="px-4 py-3 text-right">
                  <T k="colActions" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 text-sm">
              {clients.map((client) => {
                const effectiveColor = client.effective_color || '#808080';
                const isAssigned = Boolean(client.assigned_employee);
                return (
                  <tr key={client.id} className="hover:bg-default-100/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-3.5 rounded-full shadow-sm shrink-0"
                          style={{ backgroundColor: effectiveColor }}
                          title={`Effective color: ${effectiveColor}`}
                        />
                        <div>
                          <p className="font-bold text-sm text-foreground">
                            {client.first_name} {client.last_name}
                          </p>
                          <span className="text-[10px] font-mono text-muted">
                            {isAssigned ? 'Inherited Tag' : 'Unassigned'} ({effectiveColor})
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Building className="size-3.5 text-brand-gold" />
                        <span>{client.company_name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => handleCopyPhone(e, client.phone, client.id)}
                        className="font-mono text-xs font-semibold hover:text-brand-gold transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{client.phone}</span>
                        <Copy className="size-3 opacity-60" />
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      {client.assigned_employee ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: client.assigned_employee.color || '#808080' }}
                          />
                          <span className="text-xs font-semibold">
                            {client.assigned_employee.first_name}{' '}
                            {client.assigned_employee.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">
                          <T k="clientUnassigned" />
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          client.is_active
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {client.is_active ? <T k="statusActive" /> : <T k="statusInactive" />}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(client)}
                          className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                          title="View Client Details"
                        >
                          <Eye className="size-4" />
                        </button>
                        {canUpdate('clients') && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(client)}
                            className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                            title="Edit Client"
                          >
                            <Pencil className="size-4" />
                          </button>
                        )}
                        {canDelete('clients') && (
                          <button
                            type="button"
                            onClick={() => setClientToDelete(client)}
                            className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 5. Pagination Controls ─────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/20 text-xs">
          <span className="text-muted">
            <T k="pagShowing" /> {page} <T k="pagOf" /> {totalPages} ({totalClients}{' '}
            <T k="clientTotal" />)
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              isDisabled={page === 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs text-foreground/70 rounded-lg"
            >
              <T k="pagPrev" />
            </Button>
            <span className="text-xs font-bold text-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              isDisabled={page === totalPages}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs text-foreground/70 rounded-lg"
            >
              <T k="pagNext" />
            </Button>
          </div>
        </div>
      )}

      {/* ── 6. Modals & Drawers Integration ────────────────────────── */}

      {/* Client Create/Edit Modal */}
      <ClientFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        mode={formModalMode}
        client={selectedClientForEdit}
        employees={employees}
        onSuccess={() => {
          fetchClients();
          fetchColorStats();
        }}
      />

      {/* Client Detail Side Drawer */}
      <ClientDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        client={selectedClientForDrawer}
        employees={employees}
        onEdit={(cl) => handleOpenEditModal(cl)}
        onDeleteSuccess={() => {
          fetchClients();
          fetchColorStats();
        }}
        onClientUpdated={() => {
          fetchClients();
          fetchColorStats();
        }}
      />

      {/* Delete Confirmation Dialog */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <Trash2 className="size-6" />
              <h3 className="text-lg font-bold font-serif">
                <T k="clientDeleteTitle" />
              </h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              <T k="clientDeleteDesc" />
            </p>
            <div className="p-3 rounded-xl bg-default-100/50 dark:bg-default-50/10 border border-border/20 text-xs font-semibold">
              Client:{' '}
              <span className="text-foreground">
                {clientToDelete.first_name} {clientToDelete.last_name}
              </span>{' '}
              ({clientToDelete.company_name})
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onPress={() => setClientToDelete(null)}
                className="font-semibold"
              >
                <T k="actionCancel" />
              </Button>
              <Button
                isDisabled={deleting}
                onPress={handleDeleteConfirm}
                className="font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                {deleting ? <Spinner size="sm" /> : <T k="actionConfirm" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
