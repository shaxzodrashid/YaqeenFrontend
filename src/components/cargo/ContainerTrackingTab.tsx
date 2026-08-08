import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  UserCheck,
  FileSpreadsheet,
  Save,
  Search,
  Filter,
  LayoutGrid,
  Kanban,
  BarChart3,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ArrowUpRight,
  Layers,
  CheckSquare,
  Square,
  Coins,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { T } from '../T';
import { useNotification } from '../../context/NotificationContext';
import { cargoKpiApi } from '../../services/cargoKpi.service';
import type {
  Shipment,
  ShipmentStatus,
  ShipmentsSummaryResponse,
} from '../../services/cargoKpi.service';
import { CargoRegistrationModal } from './CargoRegistrationModal';

export type ViewMode = 'grid' | 'kanban' | 'analytics';

function formatDateShort(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return '—';
  try {
    const cleanStr = dateStr.slice(0, 10);
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      if (mIdx >= 0 && mIdx < 12) {
        return `${monthNames[mIdx]} ${day}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return cleanStr;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr.slice(0, 10);
  }
}

const STATUS_CONFIG: {
  key: ShipmentStatus;
  labelKey: string;
  badgeClass: string;
  dotClass: string;
  bgLight: string;
  icon: React.ReactNode;
  stepIndex: number;
}[] = [
  {
    key: 'Waiting',
    labelKey: 'statusWaiting',
    badgeClass: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    dotClass: 'bg-yellow-500',
    bgLight: 'border-yellow-500/20 bg-yellow-500/5',
    icon: <Clock className="size-3.5" />,
    stepIndex: 0,
  },
  {
    key: 'In Transit',
    labelKey: 'statusInTransit',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-500',
    bgLight: 'border-blue-500/20 bg-blue-500/5',
    icon: <Truck className="size-3.5" />,
    stepIndex: 1,
  },
  {
    key: 'Border',
    labelKey: 'statusBorder',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500',
    bgLight: 'border-amber-500/20 bg-amber-500/5',
    icon: <Clock className="size-3.5" />,
    stepIndex: 2,
  },
  {
    key: 'At Station',
    labelKey: 'statusAtStation',
    badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    dotClass: 'bg-indigo-500',
    bgLight: 'border-indigo-500/20 bg-indigo-500/5',
    icon: <MapPin className="size-3.5" />,
    stepIndex: 3,
  },
  {
    key: 'Delivered',
    labelKey: 'statusDelivered',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    bgLight: 'border-emerald-500/20 bg-emerald-500/5',
    icon: <CheckCircle2 className="size-3.5" />,
    stepIndex: 4,
  },
];

const ORDERED_STATUSES: ShipmentStatus[] = [
  'Waiting',
  'In Transit',
  'Border',
  'At Station',
  'Delivered',
];

export function ContainerTrackingTab() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  // Primary states
  const [data, setData] = useState<ShipmentsSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Multi-select batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingShipmentId, setEditingShipmentId] = useState<string | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState<boolean>(false);

  // Global rate updater modal state
  const [globalRmbRate, setGlobalRmbRate] = useState<string>('7.25');

  // Inline edit row state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineDraft, setInlineDraft] = useState<Partial<Shipment>>({});

  const getStatusLabel = useCallback(
    (st: ShipmentStatus) => {
      switch (st) {
        case 'In Transit':
          return t('statusInTransit') || 'In Transit';
        case 'At Station':
          return t('statusAtStation') || 'At Station';
        case 'Border':
          return t('statusBorder') || 'Border';
        case 'Delivered':
          return t('statusDelivered') || 'Delivered';
        case 'Waiting':
          return t('statusWaiting') || 'Waiting';
        default:
          return st;
      }
    },
    [t]
  );

  const loadShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cargoKpiApi.getShipments();
      setData(res);
      if (res.current_rmb_rate) {
        setGlobalRmbRate(String(res.current_rmb_rate));
      }
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load shipments data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  const handleCopyContainerId = (containerId: string) => {
    navigator.clipboard.writeText(containerId);
    setCopiedId(containerId);
    showNotification(`Container ID "${containerId}" copied to clipboard`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingShipmentId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shipment: Shipment) => {
    setEditingShipmentId(shipment.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDeleteShipment') || 'Are you sure you want to delete this shipment?')) return;
    try {
      await cargoKpiApi.deleteShipment(id);
      showNotification(t('successShipmentDeleted') || 'Shipment deleted successfully', 'success');
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete shipment', 'error');
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm(t('confirmResetDemo') || 'Reset all shipment tracking data to default demo entries?')) return;
    try {
      await cargoKpiApi.resetShipments();
      showNotification(t('successShipmentsReset') || 'Shipments reset to default demo state', 'success');
      setSelectedIds([]);
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to reset shipments', 'error');
    }
  };

  const handleUpdateGlobalRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(globalRmbRate);
    if (isNaN(rate) || rate <= 0) {
      showNotification(t('warnRmbRatePositive') || 'Please enter a valid positive RMB exchange rate.', 'warning');
      return;
    }

    try {
      await cargoKpiApi.updateRmbRate(rate);
      showNotification(t('successRmbRateUpdated', { rate }) || `RMB rate updated to ${rate} across active shipments`, 'success');
      setIsRateModalOpen(false);
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update RMB rate', 'error');
    }
  };

  const handleStatusChangeInline = async (id: string, newStatus: ShipmentStatus) => {
    try {
      await cargoKpiApi.updateShipment(id, { status: newStatus });
      showNotification(t('successShipmentUpdated') || 'Shipment updated successfully', 'success');
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleMoveStage = async (shipment: Shipment, direction: 'next' | 'prev') => {
    const currentIndex = ORDERED_STATUSES.indexOf(shipment.status);
    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= ORDERED_STATUSES.length) return;

    const newStatus = ORDERED_STATUSES[targetIndex];
    await handleStatusChangeInline(shipment.id, newStatus);
  };

  const handleSaveInline = async (shipment: Shipment) => {
    if (!inlineEditingId) return;
    try {
      await cargoKpiApi.updateShipment(shipment.id, {
        ...shipment,
        ...inlineDraft,
      });
      showNotification(t('successRowSaved') || 'Row changes saved', 'success');
      setInlineEditingId(null);
      setInlineDraft({});
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to save row changes', 'error');
    }
  };

  // Multi-select batch handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.shipments) {
      setSelectedIds(data.shipments.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchStatusUpdate = async (newStatus: ShipmentStatus) => {
    if (selectedIds.length === 0) return;
    try {
      await cargoKpiApi.batchUpdateStatus(selectedIds, newStatus);
      showNotification(`Updated ${selectedIds.length} container(s) to ${getStatusLabel(newStatus)}`, 'success');
      setSelectedIds([]);
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Batch update failed', 'error');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected container shipments?`)) return;
    try {
      await cargoKpiApi.batchDelete(selectedIds);
      showNotification(`Deleted ${selectedIds.length} container(s)`, 'success');
      setSelectedIds([]);
      loadShipments();
    } catch (err: any) {
      showNotification(err?.message || 'Batch delete failed', 'error');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!data || !data.shipments || data.shipments.length === 0) return;
    const headers = [
      t('colContainerNo') || 'Container ID',
      t('colClientName') || 'Client',
      t('colCargo') || 'Cargo',
      t('colConfirmed') || 'Confirmed Date',
      t('colLoaded') || 'Loaded Date',
      t('colArrived') || 'Arrived Date',
      t('colRmbRate') || 'RMB Rate',
      t('colAgentName') || 'Agent',
      t('colBuyPrice') || 'Buy Cost',
      'Currency',
      t('colSellPrice') || 'Sell Price',
      t('colProfit') || 'Net Profit ($)',
      t('colStatus') || 'Status',
    ];

    const rows = data.shipments.map((s) => [
      `"${s.containerNo}"`,
      `"${s.clientName}"`,
      `"${s.cargoType}"`,
      `"${s.confirmedDate || ''}"`,
      `"${s.loadedDate || ''}"`,
      `"${s.arrivedDate || ''}"`,
      s.rmbRate,
      `"${s.agentName}"`,
      s.buyCost,
      s.buyCostCurrency || 'RMB',
      s.sellPrice,
      s.profit,
      `"${s.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Yaqeen_Container_Shipments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Shipments exported to CSV file', 'success');
  };

  // Filtered shipments list
  const filteredShipments = useMemo(() => {
    if (!data?.shipments) return [];
    return data.shipments.filter((s) => {
      const matchesSearch =
        s.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cargoType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [data?.shipments, searchQuery, statusFilter]);

  // Delayed / Action-required shipments metrics
  const delayedShipmentsCount = useMemo(() => {
    if (!data?.shipments) return 0;
    return data.shipments.filter(
      (s) => (s.status === 'Border' || s.status === 'In Transit') && !s.arrivedDate
    ).length;
  }, [data?.shipments]);

  // Analytics Metrics
  const analyticsMetrics = useMemo(() => {
    if (!data?.shipments) return { agents: [], totalSell: 0, totalBuyUSD: 0, avgMarginPct: 0 };
    const agentMap: Record<string, { count: number; buyUSD: number; sellUSD: number; profitUSD: number }> = {};
    let totalSell = 0;
    let totalBuyUSD = 0;

    data.shipments.forEach((s) => {
      const agent = s.agentName || 'Unassigned';
      if (!agentMap[agent]) {
        agentMap[agent] = { count: 0, buyUSD: 0, sellUSD: 0, profitUSD: 0 };
      }
      const buyUSD = s.buyCostCurrency === 'RMB' ? (s.buyCost / (s.rmbRate || 7.25)) : s.buyCost;
      agentMap[agent].count += 1;
      agentMap[agent].buyUSD += buyUSD;
      agentMap[agent].sellUSD += s.sellPrice;
      agentMap[agent].profitUSD += s.profit;

      totalSell += s.sellPrice;
      totalBuyUSD += buyUSD;
    });

    const agents = Object.entries(agentMap).map(([name, stat]) => ({
      name,
      ...stat,
      marginPct: stat.sellUSD > 0 ? (stat.profitUSD / stat.sellUSD) * 100 : 0,
    }));

    const avgMarginPct = totalSell > 0 ? ((data.total_net_margin || 0) / totalSell) * 100 : 0;

    return { agents, totalSell, totalBuyUSD, avgMarginPct };
  }, [data?.shipments, data?.total_net_margin]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 min-w-0 max-w-full">
      {/* Workspace Header Controls Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface border border-border shadow-sm min-w-0">
        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-muted/50 border border-border w-full lg:w-auto overflow-x-auto min-w-0 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex-1 lg:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'grid'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="size-3.5 text-brand-gold shrink-0" />
            <span><T k="viewGridView" /></span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex-1 lg:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'kanban'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Kanban className="size-3.5 text-blue-500 shrink-0" />
            <span><T k="viewKanbanPipeline" /></span>
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex-1 lg:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'analytics'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="size-3.5 text-emerald-500 shrink-0" />
            <span><T k="viewInsightsBi" /></span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-2 w-full lg:w-auto min-w-0">
          {/* FX RMB Rate Engine Toggle */}
          <button
            onClick={() => setIsRateModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title={t('currentRmbRate') || 'RMB Exchange Rate Engine'}
          >
            <Coins className="size-3.5 shrink-0" />
            <span>FX: {data?.current_rmb_rate || 7.25} RMB</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted text-foreground transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title={t('exportCsv') || 'Export CSV'}
          >
            <FileSpreadsheet className="size-3.5 text-emerald-500 shrink-0" />
            <span><T k="exportCsv" /></span>
          </button>

          {/* Refresh */}
          <button
            onClick={loadShipments}
            disabled={loading}
            className="p-2 rounded-xl border border-border hover:bg-muted text-foreground transition-all cursor-pointer shrink-0"
            title="Refresh Container Data"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Container */}
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-brand-navy shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="size-4 shrink-0" />
            <span><T k="addShipment" /></span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Bar (Vertical clean layout that NEVER overflows) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        {/* Total Active Containers Card */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              <Truck className="size-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/20 truncate shrink-0">
              {data?.shipments?.filter((s) => s.status === 'In Transit').length ?? 0} <T k="lblTransit" />
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-muted-foreground block truncate"><T k="lblActiveContainers" /></span>
            <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1 truncate">
              {data?.total_active_shipments ?? 0} <span className="text-xs font-medium text-muted-foreground"><T k="lblUnits" /></span>
            </h3>
          </div>
        </div>

        {/* Total Net Profit Yield */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <DollarSign className="size-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 flex items-center gap-0.5 shrink-0">
              <ArrowUpRight className="size-3" />
              {analyticsMetrics.avgMarginPct.toFixed(1)}%
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-muted-foreground block truncate"><T k="lblCalculatedNetYield" /></span>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-500 mt-1 truncate font-mono">
              ${(data?.total_net_margin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
              <TrendingUp className="size-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 border border-indigo-500/20 shrink-0">
              USD
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-muted-foreground block truncate"><T k="lblGrossSalesRevenue" /></span>
            <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1 truncate font-mono">
              ${Math.round(analyticsMetrics.totalSell).toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Action Required / Pending Arrival */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20 shrink-0">
              <T k="lblPendingEta" />
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-muted-foreground block truncate"><T k="lblActionRequired" /></span>
            <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1 truncate">
              {delayedShipmentsCount} <span className="text-xs font-medium text-muted-foreground"><T k="lblEnRoute" /></span>
            </h3>
          </div>
        </div>
      </div>

      {/* Batch Actions Floating Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-3.5 rounded-2xl bg-brand-navy text-white border border-brand-gold/40 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-brand-gold text-brand-navy shrink-0">
                {selectedIds.length} <T k="lblSelected" />
              </span>
              <span className="text-xs text-neutral-300 hidden md:inline truncate">
                <T k="lblBulkActionsHelp" />
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none min-w-0">
              <span className="text-[11px] font-semibold text-neutral-300 mr-1 shrink-0 hidden sm:inline"><T k="lblSetStage" /></span>
              {STATUS_CONFIG.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleBatchStatusUpdate(opt.key)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  {opt.icon}
                  <span>{getStatusLabel(opt.key)}</span>
                </button>
              ))}

              <button
                onClick={handleBatchDelete}
                className="ml-auto lg:ml-2 px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Trash2 className="size-3.5" />
                <span><T k="btnDeleteContainer" /> ({selectedIds.length})</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white shrink-0 ml-1"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface border border-border shadow-sm min-w-0">
        {/* Search Input */}
        <div className="relative w-full lg:w-72 xl:w-80 shrink-0">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchContainerPlaceholder') || 'Search Container No, Client, Agent...'}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters & Density Control */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none min-w-0">
          <Filter className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              statusFilter === 'all'
                ? 'bg-brand-navy dark:bg-brand-gold text-white dark:text-brand-navy shadow-sm'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            }`}
          >
            All ({data?.shipments?.length ?? 0})
          </button>
          {STATUS_CONFIG.map((opt) => {
            const count = data?.status_counts?.[opt.key] ?? data?.shipments?.filter((s) => s.status === opt.key).length ?? 0;
            return (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key.toLowerCase())}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  statusFilter === opt.key.toLowerCase()
                    ? 'bg-brand-gold/20 border border-brand-gold text-brand-gold'
                    : 'bg-muted/30 hover:bg-muted text-muted-foreground'
                }`}
              >
                {opt.icon}
                <span>{getStatusLabel(opt.key)}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background border border-border">
                  {count}
                </span>
              </button>
            );
          })}

          {/* Density Toggle (Grid Mode - Desktop only) */}
          {viewMode === 'grid' && (
            <button
              onClick={() => setDensity((prev) => (prev === 'comfortable' ? 'compact' : 'comfortable'))}
              className="hidden lg:flex ml-2 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-border hover:bg-muted text-muted-foreground items-center gap-1 cursor-pointer shrink-0"
              title={t('titleToggleRowDensity') || 'Toggle Row Density'}
            >
              <Layers className="size-3.5" />
              <span className="capitalize">{density}</span>
            </button>
          )}

          <button
            onClick={handleResetDemoData}
            className="ml-auto text-[11px] font-semibold text-rose-500 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer shrink-0"
          >
            {t('resetDemo') || 'Reset Demo'}
          </button>
        </div>
      </div>

      {/* WORKSPACE VIEW 1: CLEAN DATA VISUALIZATION GRID */}
      {viewMode === 'grid' && (
        <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden min-w-0 max-w-full">
          <div className="overflow-x-auto w-full min-w-0">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider select-none sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button
                      onClick={() => handleSelectAll(selectedIds.length !== (data?.shipments?.length ?? 0))}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {selectedIds.length > 0 && selectedIds.length === data?.shipments?.length ? (
                        <CheckSquare className="size-4 text-brand-gold" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 min-w-[150px]">{t('colContainerNo') || 'Container ID'}</th>
                  <th className="px-4 py-3 min-w-[150px]">{t('colClientName') || 'Client'}</th>
                  <th className="px-4 py-3 min-w-[150px]">{t('colCargo') || 'Cargo'}</th>
                  <th className="px-4 py-3 min-w-[200px]"><T k="colMilestoneProgress" /></th>
                  <th className="px-3 py-3 min-w-[90px]">{t('colRmbRate') || 'RMB Rate'}</th>
                  <th className="px-4 py-3 min-w-[130px]"><T k="colAgentName" /></th>
                  <th className="px-4 py-3 min-w-[120px]"><T k="colBuyPrice" /></th>
                  <th className="px-4 py-3 min-w-[110px]"><T k="colSellPrice" /></th>
                  <th className="px-4 py-3 min-w-[130px]"><T k="colNetYield" /></th>
                  <th className="px-4 py-3 min-w-[140px]"><T k="colStatusStage" /></th>
                  <th className="px-3 py-3 text-right min-w-[90px]">{t('colActions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                      <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-brand-gold" />
                      <span>{t('loadingShipments') || 'Loading container stream...'}</span>
                    </td>
                  </tr>
                ) : filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                      <Truck className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="font-bold text-foreground text-sm">{t('noShipmentsFound') || 'No containers found'}</p>
                      <p className="text-xs mt-1">{t('noShipmentsDesc') || 'Try adjusting your search query or status filters'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shp) => {
                    const isSelected = selectedIds.includes(shp.id);
                    const isInlineEditing = inlineEditingId === shp.id;
                    const currentStatusOpt = STATUS_CONFIG.find((o) => o.key === shp.status) || STATUS_CONFIG[0];
                    const py = density === 'compact' ? 'py-2' : 'py-3.5';

                    const buyCostUSD = shp.buyCostCurrency === 'RMB' ? (shp.buyCost / (shp.rmbRate || 7.25)) : shp.buyCost;
                    const marginPct = shp.sellPrice > 0 ? (shp.profit / shp.sellPrice) * 100 : 0;

                    return (
                      <tr
                        key={shp.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          isSelected ? 'bg-brand-gold/10 dark:bg-brand-gold/5' : ''
                        } ${isInlineEditing ? 'bg-amber-500/10' : ''}`}
                      >
                        {/* Select checkbox */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleSelect(shp.id)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="size-4 text-brand-gold" />
                            ) : (
                              <Square className="size-4" />
                            )}
                          </button>
                        </td>

                        {/* Container ID */}
                        <td className={`px-4 ${py} font-bold font-mono text-foreground`}>
                          {isInlineEditing ? (
                            <input
                              type="text"
                              value={inlineDraft.containerNo ?? shp.containerNo}
                              onChange={(e) => setInlineDraft({ ...inlineDraft, containerNo: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-brand-gold bg-background font-mono text-xs"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 group">
                              <span className="p-1 rounded-md bg-brand-gold/15 text-brand-gold shrink-0">
                                <Truck className="size-3.5" />
                              </span>
                              <span className="tracking-tight whitespace-nowrap">{shp.containerNo}</span>
                              <button
                                onClick={() => handleCopyContainerId(shp.containerNo)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground cursor-pointer ml-auto"
                                title={t('btnCopyId') || 'Copy ID'}
                              >
                                {copiedId === shp.containerNo ? (
                                  <Check className="size-3 text-emerald-500" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Client Name */}
                        <td className={`px-4 ${py} font-semibold text-foreground`}>
                          {isInlineEditing ? (
                            <input
                              type="text"
                              value={inlineDraft.clientName ?? shp.clientName}
                              onChange={(e) => setInlineDraft({ ...inlineDraft, clientName: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-brand-gold bg-background text-xs"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[140px]">{shp.clientName}</span>
                            </div>
                          )}
                        </td>

                        {/* Cargo Type */}
                        <td className={`px-4 ${py} text-muted-foreground font-medium`}>
                          {isInlineEditing ? (
                            <input
                              type="text"
                              value={inlineDraft.cargoType ?? shp.cargoType}
                              onChange={(e) => setInlineDraft({ ...inlineDraft, cargoType: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-brand-gold bg-background text-xs"
                            />
                          ) : (
                            <span className="line-clamp-2 text-xs">{shp.cargoType}</span>
                          )}
                        </td>

                        {/* Visual Milestone Lifecycle Progress */}
                        <td className={`px-4 ${py}`}>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1">
                              {STATUS_CONFIG.map((st, idx) => {
                                const isPassed = currentStatusOpt.stepIndex >= idx;
                                const isCurrent = currentStatusOpt.stepIndex === idx;
                                return (
                                  <div key={st.key} className="flex items-center flex-1">
                                    <div
                                      className={`size-2.5 rounded-full transition-all ${
                                        isCurrent
                                          ? `${st.dotClass} ring-4 ring-${st.dotClass}/20 scale-110`
                                          : isPassed
                                          ? st.dotClass
                                          : 'bg-muted-foreground/30'
                                      }`}
                                      title={st.key}
                                    />
                                    {idx < STATUS_CONFIG.length - 1 && (
                                      <div
                                        className={`h-0.5 flex-1 mx-0.5 rounded-full transition-colors ${
                                          isPassed && currentStatusOpt.stepIndex > idx
                                            ? 'bg-brand-gold'
                                            : 'bg-border'
                                        }`}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                              <span><T k="lblConfShort" />: {formatDateShort(shp.confirmedDate)}</span>
                              <span><T k="lblArrShort" />: {formatDateShort(shp.arrivedDate)}</span>
                            </div>
                          </div>
                        </td>

                        {/* RMB Rate */}
                        <td className={`px-3 ${py} font-semibold text-brand-gold`}>
                          {isInlineEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={inlineDraft.rmbRate ?? shp.rmbRate}
                              onChange={(e) =>
                                setInlineDraft({
                                  ...inlineDraft,
                                  rmbRate: parseFloat(e.target.value) || 7.25,
                                })
                              }
                              className="w-16 px-1.5 py-1 rounded border border-brand-gold bg-background text-xs"
                            />
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                              {shp.rmbRate}
                            </span>
                          )}
                        </td>

                        {/* Freight Agent Name */}
                        <td className={`px-4 ${py} text-foreground font-medium`}>
                          {isInlineEditing ? (
                            <input
                              type="text"
                              value={inlineDraft.agentName ?? shp.agentName}
                              onChange={(e) => setInlineDraft({ ...inlineDraft, agentName: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-brand-gold bg-background text-xs"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[120px]">{shp.agentName}</span>
                            </div>
                          )}
                        </td>

                        {/* Buy Cost (USD preview + RMB tag) */}
                        <td className={`px-4 ${py} font-semibold whitespace-nowrap`}>
                          {isInlineEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={inlineDraft.buyCost ?? shp.buyCost}
                                onChange={(e) =>
                                  setInlineDraft({
                                    ...inlineDraft,
                                    buyCost: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-20 px-1.5 py-1 rounded border border-brand-gold bg-background text-xs"
                              />
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {shp.buyCostCurrency || 'RMB'}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div className="font-bold text-foreground">
                                ${Math.round(buyCostUSD).toLocaleString()}
                              </div>
                              {shp.buyCostCurrency === 'RMB' && (
                                <div className="text-[10px] font-medium text-muted-foreground">
                                  ¥{shp.buyCost.toLocaleString()} RMB
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Sell Price */}
                        <td className={`px-4 ${py} font-bold text-foreground whitespace-nowrap text-sm`}>
                          {isInlineEditing ? (
                            <input
                              type="number"
                              value={inlineDraft.sellPrice ?? shp.sellPrice}
                              onChange={(e) =>
                                setInlineDraft({
                                  ...inlineDraft,
                                  sellPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-20 px-1.5 py-1 rounded border border-brand-gold bg-background text-xs"
                            />
                          ) : (
                            <span>${shp.sellPrice.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Net Yield Profit & Margin % */}
                        <td className={`px-4 ${py} whitespace-nowrap`}>
                          <div className="inline-flex flex-col">
                            <span className="font-black text-emerald-500 text-sm">
                              +${shp.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                              {marginPct.toFixed(1)}% <T k="lblYieldMargin" />
                            </span>
                          </div>
                        </td>

                        {/* Status Stage Selection Dropdown */}
                        <td className={`px-4 ${py}`}>
                          <select
                            value={shp.status}
                            onChange={(e) => handleStatusChangeInline(shp.id, e.target.value as ShipmentStatus)}
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold border focus:outline-none cursor-pointer ${currentStatusOpt.badgeClass}`}
                          >
                            {STATUS_CONFIG.map((opt) => (
                              <option key={opt.key} value={opt.key} className="bg-background text-foreground font-semibold">
                                {getStatusLabel(opt.key)}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Actions */}
                        <td className={`px-3 ${py} text-right`}>
                          <div className="flex items-center justify-end gap-1">
                            {isInlineEditing ? (
                              <button
                                onClick={() => handleSaveInline(shp)}
                                className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                title={t('btnSaveChanges') || 'Save Changes'}
                              >
                                <Save className="size-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenEdit(shp)}
                                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title={t('btnEditDetails') || 'Edit Details'}
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(shp.id)}
                              className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                              title={t('btnDeleteContainer') || 'Delete Container'}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WORKSPACE VIEW 2: LOGISTICS KANBAN BOARD PIPELINE (RESPONSIVE SNAP-SCROLL BOARD) */}
      {viewMode === 'kanban' && (
        <div className="space-y-3 min-w-0 max-w-full">
          {/* Mobile stage selector indicator */}
          <p className="text-[11px] text-muted-foreground xl:hidden font-medium">
            <T k="lblKanbanSwipeHelp" />
          </p>

          <div className="flex xl:grid xl:grid-cols-5 overflow-x-auto snap-x snap-mandatory max-w-full pb-4 gap-3.5 sm:gap-4 scrollbar-thin min-w-0">
            {STATUS_CONFIG.map((col) => {
              const colShipments = filteredShipments.filter((s) => s.status === col.key);
              const totalColProfit = colShipments.reduce((sum, s) => sum + s.profit, 0);

              return (
                <div
                  key={col.key}
                  className="w-[280px] sm:w-[320px] xl:w-auto shrink-0 snap-start p-3.5 sm:p-4 rounded-2xl bg-surface border border-border shadow-sm flex flex-col h-full min-h-[480px] sm:min-h-[520px] min-w-0"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`p-1.5 rounded-lg border shrink-0 ${col.badgeClass}`}>
                        {col.icon}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-foreground uppercase tracking-wider truncate">
                          {getStatusLabel(col.key)}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-medium block truncate">
                          {colShipments.length} <T k="lblContainersCount" />
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                      +${Math.round(totalColProfit).toLocaleString()}
                    </span>
                  </div>

                  {/* Column Card List */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {colShipments.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                        <Truck className="size-6 mx-auto mb-1 opacity-40" />
                        <span className="text-xs font-semibold"><T k="noContainersInStage" /></span>
                      </div>
                    ) : (
                      colShipments.map((shp) => {
                        const buyUSD = shp.buyCostCurrency === 'RMB' ? shp.buyCost / (shp.rmbRate || 7.25) : shp.buyCost;
                        return (
                          <motion.div
                            key={shp.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3.5 sm:p-4 rounded-xl bg-background border border-border shadow-sm hover:border-brand-gold/50 transition-all space-y-3 group min-w-0"
                          >
                            {/* Top Row: Container ID & Profit */}
                            <div className="flex items-center justify-between min-w-0">
                              <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-foreground truncate min-w-0">
                                <span className="p-1 rounded bg-brand-gold/15 text-brand-gold shrink-0">
                                  <Truck className="size-3.5" />
                                </span>
                                <span className="truncate">{shp.containerNo}</span>
                              </div>
                              <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                                +${Math.round(shp.profit).toLocaleString()}
                              </span>
                            </div>

                            {/* Client & Cargo */}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{shp.clientName}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{shp.cargoType}</p>
                            </div>

                            {/* Agent & FX Rate */}
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/60 min-w-0">
                              <span className="flex items-center gap-1 truncate min-w-0">
                                <UserCheck className="size-3 shrink-0" />
                                <span className="truncate">{shp.agentName}</span>
                              </span>
                              <span className="font-semibold text-brand-gold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 shrink-0">
                                FX: {shp.rmbRate}
                              </span>
                            </div>

                            {/* Cost Breakdown Pill */}
                            <div className="p-2 rounded-lg bg-muted/40 text-[10px] flex items-center justify-between font-mono">
                              <span className="text-muted-foreground">
                                <T k="colBuyPrice" />: ${Math.round(buyUSD).toLocaleString()}
                              </span>
                              <span className="font-bold text-foreground"><T k="colSellPrice" />: ${shp.sellPrice.toLocaleString()}</span>
                            </div>

                            {/* Stage Transition Quick Buttons */}
                            <div className="flex items-center justify-between pt-1">
                              <button
                                onClick={() => handleMoveStage(shp, 'prev')}
                                disabled={col.stepIndex === 0}
                                className="p-1 rounded-lg border border-border hover:bg-muted disabled:opacity-30 cursor-pointer text-muted-foreground hover:text-foreground"
                                title={t('btnPrevStage') || 'Move to Previous Stage'}
                              >
                                <ChevronLeft className="size-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(shp)}
                                className="text-[11px] font-bold text-brand-gold hover:underline cursor-pointer"
                              >
                                <T k="btnViewDetails" />
                              </button>

                              <button
                                onClick={() => handleMoveStage(shp, 'next')}
                                disabled={col.stepIndex === STATUS_CONFIG.length - 1}
                                className="p-1 rounded-lg border border-border hover:bg-muted disabled:opacity-30 cursor-pointer text-muted-foreground hover:text-foreground"
                                title={t('btnNextStage') || 'Advance to Next Stage'}
                              >
                                <ChevronRight className="size-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WORKSPACE VIEW 3: FINANCIAL & FORWARDER INSIGHTS DASHBOARD */}
      {viewMode === 'analytics' && (
        <div className="space-y-6 min-w-0 max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
            {/* Agent / Forwarder Yield Matrix */}
            <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-4 min-w-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-5 text-brand-gold shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
                    <T k="lblForwarderPerformanceMatrix" />
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                  {analyticsMetrics.agents.length} <T k="lblActiveAgents" />
                </span>
              </div>

              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border uppercase">
                    <tr>
                      <th className="px-3 py-2.5"><T k="colAgentName" /></th>
                      <th className="px-3 py-2.5 text-center"><T k="colContainers" /></th>
                      <th className="px-3 py-2.5"><T k="colTotalBuyCost" /></th>
                      <th className="px-3 py-2.5"><T k="colTotalRevenue" /></th>
                      <th className="px-3 py-2.5"><T k="colNetYield" /></th>
                      <th className="px-3 py-2.5 text-right"><T k="colYieldPct" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {analyticsMetrics.agents.map((ag) => (
                      <tr key={ag.name} className="hover:bg-muted/30">
                        <td className="px-3 py-3 font-bold text-foreground">{ag.name}</td>
                        <td className="px-3 py-3 text-center font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-muted border border-border">
                            {ag.count}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground font-mono">${Math.round(ag.buyUSD).toLocaleString()}</td>
                        <td className="px-3 py-3 font-bold text-foreground font-mono">${Math.round(ag.sellUSD).toLocaleString()}</td>
                        <td className="px-3 py-3 font-black text-emerald-500 font-mono">${Math.round(ag.profitUSD).toLocaleString()}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, ag.marginPct))}%` }}
                              />
                            </div>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                              {ag.marginPct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Overview & FX Sensitivity */}
            <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-4 min-w-0">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Coins className="size-5 text-amber-500 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
                  <T k="lblFxSensitivity" />
                </h3>
              </div>

              <p className="text-xs text-muted-foreground">
                <T k="lblCurrentRmbBaseline" /> <strong className="text-foreground">{data?.current_rmb_rate || 7.25} RMB / USD</strong>.
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs gap-2">
                  <div>
                    <span className="font-bold text-foreground block"><T k="lblRmbRatePlus" /></span>
                    <span className="text-[11px] text-muted-foreground"><T k="lblCheaperRmbCost" /></span>
                  </div>
                  <span className="font-black text-emerald-500 text-sm whitespace-nowrap">
                    +${Math.round((analyticsMetrics.totalBuyUSD * 0.1) / 7.25).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between text-xs gap-2">
                  <div>
                    <span className="font-bold text-foreground block"><T k="lblRmbRateMinus" /></span>
                    <span className="text-[11px] text-muted-foreground"><T k="lblStrongerRmbCost" /></span>
                  </div>
                  <span className="font-black text-rose-500 text-sm whitespace-nowrap">
                    -${Math.round((analyticsMetrics.totalBuyUSD * 0.1) / 7.25).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => setIsRateModalOpen(true)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-gold hover:bg-brand-gold/90 text-brand-navy shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <TrendingUp className="size-4 shrink-0" />
                  <span><T k="btnAdjustGlobalRmbEngine" /></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARED UNIFIED CARGO REGISTRATION MODAL */}
      <CargoRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadShipments}
        editingId={editingShipmentId}
      />

      {/* Global RMB Exchange Rate Modal */}
      <AnimatePresence>
        {isRateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRateModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden z-10"
            >
              <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 to-amber-500 text-white flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Coins className="size-5 shrink-0" />
                  <span>{t('updateGlobalRmbRate') || 'Update Global RMB Rate Engine'}</span>
                </h3>
                <button
                  onClick={() => setIsRateModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-200 hover:text-white hover:bg-white/10"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateGlobalRate} className="p-4 sm:p-6 space-y-4">
                <p className="text-xs text-muted-foreground">
                  <T k="updateRmbEngineDesc" />
                </p>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {t('currentRmbRate') || 'Global RMB Rate (1 USD = X RMB)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={globalRmbRate}
                    onChange={(e) => setGlobalRmbRate(e.target.value)}
                    placeholder="7.25"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg font-black font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsRateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted cursor-pointer"
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md cursor-pointer"
                  >
                    {t('btnUpdateRate') || 'Update FX Rate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
