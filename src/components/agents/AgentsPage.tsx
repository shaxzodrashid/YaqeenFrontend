import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Button, Spinner } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Building2,
  Phone,
  LayoutGrid,
  Table as TableIcon,
  Check,
  Copy,
  X,
  RefreshCw,
  Mail,
  Truck,
  Package,
  DollarSign,
  ArrowUpDown,
  Tag,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { usePermissions } from '../../context/PermissionsContext';
import { api } from '../../services/api';
import type { Agent, AgentSortField, AgentSortOrder } from '../../types/agents';
import { AgentFormModal } from './AgentFormModal';
import { AgentViewModal } from './AgentViewModal';
import { Select } from '../Select';
import type { SelectOption } from '../Select';
import { T } from '../T';

/* ── Framer Motion Animation Variants ─────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
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

export function AgentsPage() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // Data states
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAgents, setTotalAgents] = useState(0);

  // Filter & Search states
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<AgentSortField>('created_at');
  const [sortOrder, setSortOrder] = useState<AgentSortOrder>('desc');

  // View Mode: Grid Cards vs Compact Table View
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals & Drawers
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState<Agent | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAgentForView, setSelectedAgentForView] = useState<Agent | null>(null);

  // Quick action feedback
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Delete & Soft-Deactivate confirmation modal
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState(false);

  // AbortController for race-free requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch Agents List
  const fetchAgents = useCallback(
    async (isManualRefresh = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        let is_active: boolean | undefined = undefined;
        if (activeStatusFilter === 'active') is_active = true;
        if (activeStatusFilter === 'inactive') is_active = false;

        const res = await api.agents.list(
          {
            page,
            limit,
            q: searchQuery || undefined,
            is_active,
            sort_by: sortBy,
            sort_order: sortOrder,
          },
          controller.signal
        );

        setAgents(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotalAgents(res.meta?.total || 0);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          showNotification(err?.message || 'Failed to load shipping agents', 'error');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, searchQuery, activeStatusFilter, sortBy, sortOrder, showNotification]
  );

  useEffect(() => {
    fetchAgents();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAgents]);

  // Debounced search handler
  const handleSearchChange = (val: string) => {
    setSearchInputValue(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val.trim());
      setPage(1);
    }, 250);
  };

  // Copy phone handler
  const handleCopyPhone = (e: React.MouseEvent, phoneNum: string, agentId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phoneNum);
    setCopiedPhoneId(agentId);
    showNotification(t('clientPhoneCopied') || 'Phone number copied to clipboard', 'info');
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInputValue('');
    setSearchQuery('');
    setActiveStatusFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  // Open Modals
  const handleOpenCreateModal = () => {
    setSelectedAgentForEdit(null);
    setFormModalMode('create');
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (ag: Agent) => {
    setSelectedAgentForEdit(ag);
    setFormModalMode('edit');
    setFormModalOpen(true);
  };

  const handleOpenViewModal = (ag: Agent) => {
    setSelectedAgentForView(ag);
    setViewModalOpen(true);
  };

  // Delete / Soft-Deactivate confirmation
  const handleDeleteConfirm = async () => {
    if (!agentToDelete) return;
    setDeleting(true);
    try {
      const res = await api.agents.delete(agentToDelete.id);
      if (res.deactivated) {
        showNotification(
          t('agentDeactivatedNotice') ||
            'Agent has associated cargo shipments and was set to inactive status to protect data integrity.',
          'warning'
        );
      } else {
        showNotification(
          t('agentDeletedSuccess') || 'Shipping agent successfully deleted.',
          'success'
        );
      }
      setAgentToDelete(null);
      fetchAgents();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete agent', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(
    searchQuery || activeStatusFilter !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc'
  );

  // Compute KPI summary aggregations
  const stats = useMemo(() => {
    let activeCount = 0;
    let totalCargos = 0;
    let activeCargos = 0;
    let totalPayable = 0;

    for (const a of agents) {
      if (a.is_active) activeCount++;
      totalCargos += a.total_cargos_count || 0;
      activeCargos += a.active_cargos_count || 0;
      totalPayable += a.total_payable_amount || 0;
    }

    return {
      activeCount,
      totalCargos,
      activeCargos,
      totalPayable,
    };
  }, [agents]);

  // Sort select options
  const sortOptions: SelectOption[] = useMemo(
    () => [
      { value: 'created_at', label: t('agentSortNewest') || 'Newest Added' },
      { value: 'first_name', label: t('agentSortName') || 'Contact Name' },
      { value: 'company_name', label: t('agentSortCompany') || 'Company Name' },
      { value: 'total_cargos_count', label: t('agentSortCargos') || 'Total Cargos' },
      { value: 'total_payable_amount', label: t('agentSortDebt') || 'Payable Debt' },
    ],
    [t]
  );

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
            <h1 className="text-2xl md:text-3xl font-bold font-serif tracking-tight text-foreground flex items-center gap-2.5">
              <Truck className="size-7 text-brand-gold shrink-0" />
              <span>{t('agentTitle') || 'Shipping Agents & Carriers'}</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold font-bold text-xs border border-brand-gold/30">
              {totalAgents} {t('agentTotal') || 'Total'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted mt-1">
            {t('agentSubtitle') ||
              'Centralized registry of shipping agents, line-haul carriers, company aliases, and accounts payable'}
          </p>
        </div>

        {/* Action Button: Add Agent */}
        {canCreate('agents') && (
          <div className="flex items-center gap-3">
            <Button
              onPress={handleOpenCreateModal}
              className="bg-brand-royal text-white hover:bg-brand-royal/90 font-bold px-5 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="size-4 mr-1.5" />
              <span>{t('agentAddNew') || 'Add Shipping Agent'}</span>
            </Button>
          </div>
        )}
      </motion.div>

      {/* ── 2. Top Analytics Header: Live Logistics KPI Summary ─────── */}
      <motion.div variants={headerVariants} initial="hidden" animate="show">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Agents */}
          <div className="p-4 rounded-2xl bg-surface border border-border/30 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                {t('agentTotal') || 'Total Agents'}
              </p>
              <p className="text-2xl font-bold font-serif text-foreground">{totalAgents}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>{stats.activeCount} active in current view</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-royal/10 dark:bg-brand-royal/20 flex items-center justify-center text-brand-royal dark:text-brand-gold">
              <Building2 className="size-6" />
            </div>
          </div>

          {/* Card 2: Active Carriers */}
          <div className="p-4 rounded-2xl bg-surface border border-border/30 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                {t('agentActive') || 'Active Carriers'}
              </p>
              <p className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
                {stats.activeCount}
              </p>
              <p className="text-[11px] text-muted">Ready for consignment dispatch</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-6" />
            </div>
          </div>

          {/* Card 3: Total Cargos Handled */}
          <div className="p-4 rounded-2xl bg-surface border border-border/30 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                {t('agentTotalCargos') || 'Total Cargos Handled'}
              </p>
              <p className="text-2xl font-bold font-serif text-foreground">{stats.totalCargos}</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                {stats.activeCargos} currently in transit
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Package className="size-6" />
            </div>
          </div>

          {/* Card 4: Total Accounts Payable (Debt) */}
          <div className="p-4 rounded-2xl bg-surface border border-border/30 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                {t('agentTotalPayable') || 'Accounts Payable (Debt)'}
              </p>
              <p className="text-2xl font-bold font-serif text-amber-600 dark:text-amber-400">
                ${stats.totalPayable.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted">Carrier freight balance (USD)</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <DollarSign className="size-6" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3. Filters & Search Toolbar ────────────────────────────── */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="show"
        className="p-4 rounded-2xl bg-surface border border-border/30 shadow-sm space-y-3"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('agentSearch') || 'Search by name, company, alias, phone, or email...'}
              className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-field text-field-foreground border border-field-border focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 transition-all outline-none"
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

          {/* Controls: Active Segment, Sort, View Toggle, Refresh */}
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Sort Selector */}
            <Select
              size="sm"
              value={sortBy}
              onChange={(val) => {
                setSortBy(val as AgentSortField);
                setPage(1);
              }}
              placeholder={t('agentSortBy') || 'Sort By'}
              allowClear={false}
              fullWidth={false}
              className="w-40 sm:w-44 shrink-0"
              startContent={<ArrowUpDown className="size-3.5 text-muted shrink-0" />}
              options={sortOptions}
              aria-label="Sort shipping agents"
            />

            {/* Sort Order Toggle */}
            <button
              type="button"
              onClick={() => {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                setPage(1);
              }}
              className="p-2 rounded-xl border border-border/30 bg-default-100/40 hover:bg-default-100 text-muted hover:text-foreground transition-colors cursor-pointer"
              title={`Sort order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown
                className={`size-4 transition-transform duration-200 ${
                  sortOrder === 'asc' ? 'rotate-180 text-brand-gold' : ''
                }`}
              />
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchAgents(true)}
              className="p-2 rounded-xl border border-border/30 bg-default-100/40 hover:bg-default-100 text-muted hover:text-foreground transition-colors cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className={`size-4 ${refreshing ? 'animate-spin text-brand-gold' : ''}`} />
            </button>

            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center p-1 rounded-xl bg-default-100/60 dark:bg-default-50/20 border border-border/30">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-surface text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-surface text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
                title="Table List View"
              >
                <TableIcon className="size-4" />
              </button>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onPress={handleResetFilters}
                className="text-xs text-muted hover:text-foreground font-semibold rounded-xl"
              >
                <X className="size-3.5 mr-1" />
                <T k="clientClearFilters" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 4. Main Content: Grid vs Table View ────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Spinner size="lg" className="text-brand-gold" />
          <p className="text-xs font-semibold text-muted">Loading shipping agents...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border/30 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-brand-royal/10 dark:bg-brand-royal/20 flex items-center justify-center text-brand-royal dark:text-brand-gold mx-auto">
            <Truck className="size-8" />
          </div>
          <h3 className="text-lg font-bold font-serif text-foreground">
            {t('agentNoResults') || 'No shipping agents found'}
          </h3>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
            {t('agentNoResultsDesc') ||
              'Try adjusting your search query, status filters, or create a new shipping agent record.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onPress={handleResetFilters}
                className="font-semibold text-xs rounded-xl"
              >
                Clear All Filters
              </Button>
            )}
            {canCreate('agents') && (
              <Button
                size="sm"
                onPress={handleOpenCreateModal}
                className="bg-brand-royal text-white font-bold text-xs rounded-xl shadow-sm"
              >
                <Plus className="size-3.5 mr-1.5" />
                <span>Add Shipping Agent</span>
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID CARDS VIEW ───────────────────────────────────────── */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {agents.map((ag) => {
              const displayName =
                ag.display_name ||
                [ag.first_name, ag.last_name].filter(Boolean).join(' ') ||
                ag.company_name ||
                'Agent';

              const initials =
                ag.first_name || ag.last_name
                  ? `${ag.first_name?.[0] || ''}${ag.last_name?.[0] || ''}`.toUpperCase()
                  : ag.company_name
                    ? ag.company_name.slice(0, 2).toUpperCase()
                    : 'AG';

              const isCopied = copiedPhoneId === ag.id;

              return (
                <motion.div
                  key={ag.id}
                  variants={cardVariants}
                  layout
                  onClick={() => handleOpenViewModal(ag)}
                  className="group relative rounded-2xl bg-surface border border-border/30 hover:border-brand-gold/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
                >
                  {/* Glowing left color indicator bar */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1.5 transition-colors duration-300 ${
                      ag.is_active ? 'bg-brand-royal dark:bg-brand-gold' : 'bg-rose-500'
                    }`}
                  />

                  {/* Card Main Body */}
                  <div className="p-5 pl-6 space-y-4">
                    {/* Top Row: Avatar + Status */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-xl bg-brand-navy border border-brand-gold/30 flex items-center justify-center font-bold text-xs text-brand-gold shadow-xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold font-serif text-foreground group-hover:text-brand-gold transition-colors leading-snug truncate">
                            {displayName}
                          </h3>
                          {ag.company_name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted font-semibold truncate">
                              <Building2 className="size-3 text-brand-gold shrink-0" />
                              <span className="truncate">{ag.company_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          ag.is_active
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {ag.is_active ? <T k="statusActive" /> : <T k="statusInactive" />}
                      </span>
                    </div>

                    {/* Company Aliases Pills */}
                    {ag.company_names && ag.company_names.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ag.company_names.slice(0, 3).map((alias, idx) => (
                          <span
                            key={`${alias}-${idx}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-default-100/70 dark:bg-default-50/20 text-muted border border-border/20"
                          >
                            <Tag className="size-2.5 opacity-60" />
                            <span className="truncate max-w-[140px]">{alias}</span>
                          </span>
                        ))}
                        {ag.company_names.length > 3 && (
                          <span className="text-[10px] text-muted font-semibold">
                            +{ag.company_names.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Contact Badges: Phone & Email */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {ag.phone_number && (
                        <div
                          onClick={(e) => handleCopyPhone(e, ag.phone_number!, ag.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-default-100/60 dark:bg-default-50/20 hover:bg-brand-gold/15 hover:text-brand-gold text-xs font-mono font-semibold text-foreground transition-colors group/phone"
                          title="Click to copy phone number"
                        >
                          <Phone className="size-3 text-brand-gold shrink-0" />
                          <span>{ag.phone_number}</span>
                          {isCopied ? (
                            <Check className="size-3 text-emerald-500 ml-1" />
                          ) : (
                            <Copy className="size-3 opacity-0 group-hover/phone:opacity-100 text-muted transition-opacity ml-1" />
                          )}
                        </div>
                      )}

                      {ag.email && (
                        <a
                          href={`mailto:${ag.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-default-100/60 dark:bg-default-50/20 hover:bg-brand-royal/10 text-xs font-mono text-muted hover:text-brand-royal dark:hover:text-brand-gold transition-colors"
                          title="Send email"
                        >
                          <Mail className="size-3 text-brand-gold shrink-0" />
                          <span className="truncate max-w-[150px]">{ag.email}</span>
                        </a>
                      )}
                    </div>

                    {/* Metrics Row: Cargos & Payable Debt */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/15">
                      <div className="flex items-center gap-2 text-xs">
                        <Package className="size-3.5 text-muted shrink-0" />
                        <div>
                          <span className="text-muted text-[11px]">Cargos: </span>
                          <span className="font-bold text-foreground">
                            {ag.total_cargos_count ?? 0}
                          </span>
                          {ag.active_cargos_count ? (
                            <span className="text-[10px] text-blue-500 ml-1 font-semibold">
                              ({ag.active_cargos_count} in transit)
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs justify-end">
                        <DollarSign className="size-3.5 text-amber-500 shrink-0" />
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          ${(ag.total_payable_amount ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Quick Actions */}
                  <div className="px-5 py-3 pl-6 border-t border-border/20 bg-default-50/20 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted">
                      {new Date(ag.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* View Details */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenViewModal(ag);
                        }}
                        className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                        title="View Profile Details"
                      >
                        <Eye className="size-4" />
                      </button>

                      {/* Edit */}
                      {canUpdate('agents') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(ag);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                          title="Edit Agent Profile"
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}

                      {/* Delete / Deactivate */}
                      {canDelete('agents') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAgentToDelete(ag);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete or Deactivate"
                        >
                          <Trash2 className="size-4" />
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
                  <T k="agentColName" />
                </th>
                <th className="px-4 py-3">
                  <T k="agentColCompany" />
                </th>
                <th className="px-4 py-3">
                  <T k="phoneNumber" />
                </th>
                <th className="px-4 py-3">
                  <T k="agentEmail" />
                </th>
                <th className="px-4 py-3 text-center">
                  <T k="agentColCargos" />
                </th>
                <th className="px-4 py-3 text-right">
                  <T k="agentColPayable" />
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
              {agents.map((ag) => {
                const displayName =
                  ag.display_name ||
                  [ag.first_name, ag.last_name].filter(Boolean).join(' ') ||
                  ag.company_name ||
                  'Agent';

                const initials =
                  ag.first_name || ag.last_name
                    ? `${ag.first_name?.[0] || ''}${ag.last_name?.[0] || ''}`.toUpperCase()
                    : ag.company_name
                      ? ag.company_name.slice(0, 2).toUpperCase()
                      : 'AG';

                const repName = [ag.first_name, ag.last_name].filter(Boolean).join(' ');
                const hasDistinctRep = Boolean(repName && repName !== displayName);

                return (
                  <tr key={ag.id} className="hover:bg-default-100/30 transition-colors">
                    {/* Agent Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-brand-navy border border-brand-gold/30 flex items-center justify-center font-bold text-xs text-brand-gold shadow-xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-bold text-sm text-foreground hover:text-brand-gold cursor-pointer transition-colors truncate"
                            onClick={() => handleOpenViewModal(ag)}
                          >
                            {displayName}
                          </p>
                          {hasDistinctRep && (
                            <span className="text-[11px] text-muted truncate block">{repName}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Company & Aliases */}
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Building2 className="size-3.5 text-brand-gold shrink-0" />
                          <span>{ag.company_name || '—'}</span>
                        </div>
                        {ag.company_names && ag.company_names.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-muted">
                            <Tag className="size-2.5" />
                            <span className="truncate max-w-[180px]">
                              {ag.company_names.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3">
                      {ag.phone_number ? (
                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(e, ag.phone_number!, ag.id)}
                          className="font-mono text-xs font-semibold hover:text-brand-gold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{ag.phone_number}</span>
                          <Copy className="size-3 opacity-60" />
                        </button>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3">
                      {ag.email ? (
                        <a
                          href={`mailto:${ag.email}`}
                          className="font-mono text-xs text-muted hover:text-brand-royal dark:hover:text-brand-gold transition-colors"
                        >
                          {ag.email}
                        </a>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>

                    {/* Cargos */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-xs text-foreground">
                        {ag.total_cargos_count ?? 0}
                      </span>
                      {ag.active_cargos_count ? (
                        <span className="text-[10px] text-blue-500 block font-semibold">
                          {ag.active_cargos_count} active
                        </span>
                      ) : null}
                    </td>

                    {/* Payable Debt */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                        ${(ag.total_payable_amount ?? 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          ag.is_active
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {ag.is_active ? <T k="statusActive" /> : <T k="statusInactive" />}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenViewModal(ag)}
                          className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="size-4" />
                        </button>
                        {canUpdate('agents') && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ag)}
                            className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors cursor-pointer"
                            title="Edit Agent"
                          >
                            <Pencil className="size-4" />
                          </button>
                        )}
                        {canDelete('agents') && (
                          <button
                            type="button"
                            onClick={() => setAgentToDelete(ag)}
                            className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Agent"
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
            <T k="pagShowing" /> {page} <T k="pagOf" /> {totalPages} ({totalAgents}{' '}
            {t('agentTotal') || 'Total'})
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

      {/* Agent Create / Edit Modal */}
      <AgentFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        mode={formModalMode}
        agent={selectedAgentForEdit}
        onSuccess={() => fetchAgents()}
      />

      {/* Agent Detail Centered Modal */}
      <AgentViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        agent={selectedAgentForView}
        onEdit={(ag) => handleOpenEditModal(ag)}
        onDeleteSuccess={() => fetchAgents()}
        onAgentUpdated={() => fetchAgents()}
      />

      {/* Delete / Soft-Deactivation Confirmation Dialog */}
      {agentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="size-6" />
              <h3 className="text-lg font-bold font-serif">
                {t('agentDeleteTitle') || 'Delete Shipping Agent'}
              </h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {t('agentDeleteDesc') ||
                'Are you sure you want to delete this agent? If the agent has linked cargo registrations or consolidations, they will be safely deactivated instead of deleted.'}
            </p>
            <div className="p-3 rounded-xl bg-default-100/50 dark:bg-default-50/10 border border-border/20 text-xs font-semibold">
              Agent:{' '}
              <span className="text-foreground">
                {agentToDelete.display_name ||
                  [agentToDelete.first_name, agentToDelete.last_name].filter(Boolean).join(' ') ||
                  agentToDelete.company_name}
              </span>{' '}
              {agentToDelete.company_name && `(${agentToDelete.company_name})`}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onPress={() => setAgentToDelete(null)}
                className="font-semibold text-xs rounded-xl"
              >
                <T k="actionCancel" />
              </Button>
              <Button
                isDisabled={deleting}
                onPress={handleDeleteConfirm}
                className="font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 rounded-xl cursor-pointer"
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
