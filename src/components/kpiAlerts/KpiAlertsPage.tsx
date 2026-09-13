import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Layers,
  Search,
  CheckSquare,
  Square,
  EyeOff,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { T } from '../T';
import { kpiAlertsApi } from '../../services/kpiAlerts.service';
import type {
  KpiAlertPopupResponse,
  KpiAlertSuggestion,
  DecisionAction,
  KpiDecisionDto,
  BulkKpiDecisionDto,
} from '../../types/kpiAlerts';
import { DecisionModal } from './DecisionModal';
import { BulkDecisionModal } from './BulkDecisionModal';
import { MonthEndReviewModal } from './MonthEndReviewModal';
import {
  localeCodeMap,
  formatDateLocale,
  formatCareerLevel,
  formatDeptName,
  formatApprovalStatus,
} from './kpiAlertHelpers';

export type AlertTab = 'suggestions' | 'all-employees' | 'career-matrix';

export function KpiAlertsPage() {
  const { t, locale } = useTranslation();
  const { showNotification } = useNotification();
  const localeCode = localeCodeMap[locale] || 'en-US';

  // State
  const [currentMonth, setCurrentMonth] = useState<string>('2026-09');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<KpiAlertPopupResponse | null>(null);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<AlertTab>('suggestions');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk Selection
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<string>>(new Set());

  // Modals
  const [activeSuggestion, setActiveSuggestion] = useState<KpiAlertSuggestion | null>(null);
  const [activeDecisionAction, setActiveDecisionAction] = useState<DecisionAction>('APPROVE');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  // Load Data
  const loadData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await kpiAlertsApi.getPopupData({ month: currentMonth });
        setData(res);
      } catch (err: any) {
        showNotification(err?.message || t('kpiAlertLoadFailed'), 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentMonth, showNotification, t]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for decisions
  const handleOpenDecisionModal = (suggestion: KpiAlertSuggestion, action: DecisionAction) => {
    setActiveSuggestion(suggestion);
    setActiveDecisionAction(action);
    setIsDecisionModalOpen(true);
  };

  const handleExecuteDecision = async (dto: KpiDecisionDto) => {
    try {
      await kpiAlertsApi.makeDecision(dto);
      showNotification(
        dto.action === 'APPROVE'
          ? t('kpiAlertSuccessApproved')
          : dto.action === 'MAINTAIN'
            ? t('kpiAlertSuccessMaintained')
            : t('kpiAlertSuccessRejected'),
        'success'
      );
      // Remove from selected
      if (dto.alert_id) {
        setSelectedAlertIds((prev) => {
          const next = new Set(prev);
          next.delete(dto.alert_id!);
          return next;
        });
      }
      loadData();
    } catch (err: any) {
      showNotification(err?.message || t('kpiAlertRecordDecisionFailed'), 'error');
    }
  };

  const handleExecuteBulk = async (dto: BulkKpiDecisionDto) => {
    try {
      const res = await kpiAlertsApi.makeBulkDecision(dto);
      showNotification(t('kpiAlertBatchSuccess', { count: res.successful_count }), 'success');
      setSelectedAlertIds(new Set());
      loadData();
    } catch (err: any) {
      showNotification(err?.message || t('kpiAlertBatchFailed'), 'error');
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await kpiAlertsApi.dismissAlert(alertId);
      showNotification(t('kpiAlertDismissed'), 'info');
      setSelectedAlertIds((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
      loadData();
    } catch (err: any) {
      showNotification(err?.message || t('kpiAlertDismissFailed'), 'error');
    }
  };

  // Toggle selection
  const toggleSelect = (alertId: string) => {
    setSelectedAlertIds((prev) => {
      const next = new Set(prev);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedAlertIds.size === filteredSuggestions.length) {
      setSelectedAlertIds(new Set());
    } else {
      setSelectedAlertIds(new Set(filteredSuggestions.map((s) => s.alert_id)));
    }
  };

  // Filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!data?.suggestions) return [];
    return data.suggestions.filter((s) => {
      if (filterType !== 'ALL' && s.decision_type !== filterType) return false;
      if (filterLevel !== 'ALL' && s.current_level !== filterLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.employee_name.toLowerCase().includes(q) ||
          s.department_name.toLowerCase().includes(q) ||
          s.phone.includes(q)
        );
      }
      return true;
    });
  }, [data?.suggestions, filterType, filterLevel, searchQuery]);

  // Filtered employees kpi
  const filteredEmployees = useMemo(() => {
    if (!data?.employees_kpi) return [];
    return data.employees_kpi.filter((e) => {
      if (filterLevel !== 'ALL' && e.career_level !== filterLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.employee_name.toLowerCase().includes(q) ||
          e.department_name.toLowerCase().includes(q) ||
          e.career_level.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data?.employees_kpi, filterLevel, searchQuery]);

  const selectedSuggestionsList = useMemo(() => {
    if (!data?.suggestions) return [];
    return data.suggestions.filter((s) => selectedAlertIds.has(s.alert_id));
  }, [data?.suggestions, selectedAlertIds]);

  const summary = data?.summary;
  const period = data?.period;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <RefreshCw className="size-8 text-brand-gold animate-spin" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <T k="kpiAlertLoading" />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 min-w-0 max-w-full">
      {/* ----------------------------------------------------------------- */}
      {/* 1. TOP BANNER HEADER                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-brand-navy via-brand-royal to-brand-navy border border-brand-gold/30 text-white shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-brand-gold/20 text-brand-gold border border-brand-gold/40 shadow-inner shrink-0">
              <Sparkles className="size-6 sm:size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  <T k="kpiAlertPageTitle" />
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-brand-gold text-brand-navy tracking-wider shadow-sm">
                  <T k="kpiAlertBadgeExecutive" />
                </span>
                {data?.is_last_week && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                    <Zap className="size-3" />
                    <T k="kpiAlertWindowActive" />
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-2xl">
                <T k="kpiAlertPageSubtitle" />
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Month selector */}
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
              <Calendar className="size-4 text-brand-gold shrink-0" />
              <input
                type="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              />
            </div>

            {/* Refresh button */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer shadow-xs"
              title={t('kpiAlertRefreshLive')}
            >
              <RefreshCw className={`size-4 ${refreshing ? 'animate-spin text-brand-gold' : ''}`} />
            </button>

            {/* Pop-up Trigger Preview */}
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-400 hover:opacity-95 text-brand-navy text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="size-4" />
              <span>
                <T k="kpiAlertOpenPopupPreview" />
              </span>
            </button>
          </div>
        </div>

        {/* Period Countdown Bar */}
        {period && (
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                <T k="kpiAlertPeriod" />:
              </span>
              <span>
                {formatDateLocale(period.start_date, locale)} —{' '}
                {formatDateLocale(period.end_date, locale)}{' '}
                {t('kpiAlertLastWeekStarted', {
                  date: formatDateLocale(period.last_week_start, locale),
                })}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span>
                {t('kpiAlertDayProgress', {
                  current: period.current_day,
                  total: period.total_days,
                })}
              </span>
              <div className="w-28 sm:w-36 h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-brand-gold transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(100, (period.current_day / period.total_days) * 100)}%`,
                  }}
                />
              </div>
              <span className="font-bold text-emerald-300">
                {t('kpiAlertDaysLeft', { days: period.days_remaining })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. EXECUTIVE METRIC KPI CARDS                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Employees */}
        <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              <T k="kpiAlertTotalEmployees" />
            </span>
            <Users className="size-4 text-brand-gold" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {summary?.total_employees ?? 0}
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            <T k="kpiAlertActiveStaff" />
          </div>
        </div>

        {/* Total KPI Bonus Pool */}
        <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              <T k="kpiAlertTotalBonusPool" />
            </span>
            <DollarSign className="size-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            ${summary?.total_kpi_bonus?.toLocaleString(localeCode) ?? 0}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <T k="kpiAlertLiveCalculated" />
          </div>
        </div>

        {/* Pending Decisions */}
        <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-brand-gold/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold">
              <T k="kpiAlertPendingDecisions" />
            </span>
            <Sparkles className="size-4 text-brand-gold" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {summary?.pending_decisions_count ?? 0}
          </div>
          <div className="text-[10px] text-brand-gold font-semibold">
            <T k="kpiAlertAwaitingCeo" />
          </div>
        </div>

        {/* Promotions */}
        <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <T k="kpiAlertPromotions" />
            </span>
            <ArrowUpRight className="size-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {summary?.promotions_count ?? 0}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <T k="kpiAlertRankRaises" />
          </div>
        </div>

        {/* Demotions */}
        <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <T k="kpiAlertDemotions" />
            </span>
            <ArrowDownRight className="size-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {summary?.demotions_count ?? 0}
          </div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
            <T k="kpiAlertEscalations" />
          </div>
        </div>

        {/* SR Check Approvals */}
        <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <T k="kpiAlertSrCheckExceptions" />
            </span>
            <AlertTriangle className="size-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {summary?.sr_check_approvals_count ?? 0}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
            <T k="kpiAlertAvgCheckReviews" />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. TAB SWITCHER & CONTROLS                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'suggestions'
                ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/40 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Sparkles className="size-4" />
            <span>
              <T k="kpiAlertTabSuggestions" />
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-brand-gold text-brand-navy">
              {data?.suggestions?.length ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all-employees')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'all-employees'
                ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/40 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Users className="size-4" />
            <span>
              <T k="kpiAlertTabAllEmployees" />
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-muted text-foreground">
              {data?.employees_kpi?.length ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('career-matrix')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'career-matrix'
                ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/40 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <ShieldCheck className="size-4" />
            <span>
              <T k="kpiAlertTabCareerMatrix" />
            </span>
          </button>
        </div>

        {/* Filter bar */}
        {activeTab !== 'career-matrix' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('kpiAlertSearchPlaceholder') || 'Search employee, phone...'}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            {activeTab === 'suggestions' && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold focus:outline-none focus:border-brand-gold cursor-pointer"
              >
                <option value="ALL">{t('kpiAlertAllDecisionTypes')}</option>
                <option value="PROMOTION">{t('kpiAlertPromotionsOnly')}</option>
                <option value="DEMOTION">{t('kpiAlertDemotionsOnly')}</option>
              </select>
            )}

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold focus:outline-none focus:border-brand-gold cursor-pointer"
            >
              <option value="ALL">{t('kpiAlertAllCareerLevels')}</option>
              <option value="JUNIOR">{t('careerLevelJunior')} ($300)</option>
              <option value="MID">{t('careerLevelMid')} ($500)</option>
              <option value="SENIOR">{t('careerLevelSenior')} ($700)</option>
              <option value="EXPERT">{t('careerLevelExpert')} ($1,000)</option>
            </select>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 4. BULK ACTIONS TOOLBAR (Only shown when suggestions are checked) */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'suggestions' && selectedAlertIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Layers className="size-4 text-brand-gold" />
            <span>{t('kpiAlertSelectedCount', { count: selectedAlertIds.size })}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedAlertIds(new Set())}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <T k="actionCancel" />
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-brand-gold text-brand-navy hover:opacity-95 text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="size-3.5" />
              <span>
                <T k="kpiAlertProcessBatch" />
              </span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 5. TAB 1: PENDING SUGGESTIONS & ESCALATIONS                       */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          {/* Header toolbar for suggestions */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <button
              onClick={selectAllFiltered}
              className="flex items-center gap-2 font-bold hover:text-foreground cursor-pointer"
            >
              {filteredSuggestions.length > 0 &&
              selectedAlertIds.size === filteredSuggestions.length ? (
                <CheckSquare className="size-4 text-brand-gold" />
              ) : (
                <Square className="size-4" />
              )}
              <span>{t('kpiAlertSelectAllVisible', { count: filteredSuggestions.length })}</span>
            </button>
            <span>
              <T k="kpiAlertLiveEvaluated" />
            </span>
          </div>

          {filteredSuggestions.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-surface border border-border space-y-3">
              <CheckCircle className="size-12 text-emerald-500 mx-auto opacity-80" />
              <h3 className="text-base font-bold text-foreground">
                <T k="kpiAlertNoPending" />
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                <T k="kpiAlertNoPendingDesc" />
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSuggestions.map((s) => {
                const isPromotion = s.decision_type === 'PROMOTION';
                const isDemotion = s.decision_type === 'DEMOTION';
                const isSelected = selectedAlertIds.has(s.alert_id);

                return (
                  <div
                    key={s.alert_id}
                    className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between space-y-4 shadow-xs ${
                      isSelected
                        ? 'border-brand-gold bg-brand-gold/5 shadow-md'
                        : 'border-border bg-surface hover:border-brand-gold/40'
                    }`}
                  >
                    {/* Top card bar */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSelect(s.alert_id)}
                            className="text-muted-foreground hover:text-brand-gold cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="size-4 text-brand-gold" />
                            ) : (
                              <Square className="size-4" />
                            )}
                          </button>

                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                              isPromotion
                                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            }`}
                          >
                            {isPromotion ? (
                              <ArrowUpRight className="size-5" />
                            ) : (
                              <ArrowDownRight className="size-5" />
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-foreground">{s.employee_name}</h4>
                            <div className="text-[11px] text-muted-foreground">
                              {formatDeptName(s.department_name, t)} • {s.phone}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPromotion
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isPromotion ? t('kpiAlertBadgePromotion') : t('kpiAlertBadgeDemotion')}
                        </span>
                      </div>

                      {/* Rank & Salary Transition Visual Card */}
                      <div className="p-3 rounded-xl bg-background border border-border/80 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-[10px] uppercase font-bold text-muted-foreground">
                            <T k="kpiAlertCurrent" />
                          </div>
                          <div className="text-xs font-bold text-foreground">
                            {formatCareerLevel(s.current_level, t)}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-semibold">
                            ${s.current_salary.toLocaleString(localeCode)}
                          </div>
                        </div>

                        <span className="text-brand-gold font-bold text-base">➜</span>

                        <div className="space-y-0.5 text-right">
                          <div
                            className={`text-[10px] uppercase font-bold ${
                              isPromotion
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            <T k="kpiAlertSuggestedRank" />
                          </div>
                          <div
                            className={`text-xs font-black ${
                              isPromotion
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatCareerLevel(s.suggested_level, t)}
                          </div>
                          <div className="text-[11px] font-bold text-foreground">
                            {t('kpiAlertBaseSalarySuffix', {
                              salary: s.suggested_salary.toLocaleString(localeCode),
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Performance Indicators */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                          <div className="text-[10px] text-muted-foreground font-semibold">
                            <T k="kpiAlertConsecutiveRecords" />
                          </div>
                          <div className="font-black text-foreground mt-0.5">
                            {isPromotion ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {t('kpiAlertSuccessMonths', { count: s.consecutive_successes })}
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400">
                                {t('kpiAlertMissedMonths', { count: s.consecutive_failures })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                          <div className="text-[10px] text-muted-foreground font-semibold">
                            <T k="kpiAlertBonusAndTotal" />
                          </div>
                          <div className="font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            ${s.metrics.sales_bonus_amount.toLocaleString(localeCode)} ($
                            {s.metrics.total_earnings.toLocaleString(localeCode)})
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                          <div className="text-[10px] text-muted-foreground font-semibold">
                            <T k="kpiAlertSalesTarget" />
                          </div>
                          <div className="font-bold text-foreground mt-0.5">
                            ${s.metrics.total_sales.toLocaleString(localeCode)}
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                          <div className="text-[10px] text-muted-foreground font-semibold">
                            <T k="kpiAlertAvgCheckDeals" />
                          </div>
                          <div className="font-bold text-foreground mt-0.5">
                            ${Math.round(s.metrics.average_check).toLocaleString(localeCode)} (
                            {t('kpiAlertDealsCount', { count: s.metrics.deal_count })})
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                      <button
                        onClick={() => handleDismissAlert(s.alert_id)}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
                        title={t('kpiAlertDismissTitle')}
                      >
                        <EyeOff className="size-3.5" />
                        <span>
                          <T k="kpiAlertDismiss" />
                        </span>
                      </button>

                      <div className="flex items-center gap-2">
                        {isDemotion ? (
                          <>
                            <button
                              onClick={() => handleOpenDecisionModal(s, 'MAINTAIN')}
                              className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted/40 transition-all cursor-pointer"
                            >
                              <T k="kpiAlertMaintain" />
                            </button>
                            <button
                              onClick={() => handleOpenDecisionModal(s, 'APPROVE')}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <ArrowDownRight className="size-3.5" />
                              <span>
                                <T k="kpiAlertDemote" />
                              </span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenDecisionModal(s, 'REJECT')}
                              className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                            >
                              <T k="kpiAlertReject" />
                            </button>
                            <button
                              onClick={() => handleOpenDecisionModal(s, 'APPROVE')}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:opacity-90 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <ArrowUpRight className="size-3.5" />
                              <span>
                                <T k="kpiAlertPromote" />
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 6. TAB 2: ALL EMPLOYEES PERFORMANCE TABLE                         */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'all-employees' && (
        <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-extrabold text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">
                    <T k="kpiAlertColEmployee" />
                  </th>
                  <th className="py-3.5 px-3">
                    <T k="kpiAlertColRankBase" />
                  </th>
                  <th className="py-3.5 px-3">
                    <T k="kpiAlertColSalesProgress" />
                  </th>
                  <th className="py-3.5 px-3">
                    <T k="kpiAlertColDealsAvgCheck" />
                  </th>
                  <th className="py-3.5 px-3">
                    <T k="kpiAlertColSalesBonus" />
                  </th>
                  <th className="py-3.5 px-3">
                    <T k="kpiAlertColTotalEarnings" />
                  </th>
                  <th className="py-3.5 px-3">
                    <T k="kpiAlertColConsecutive" />
                  </th>
                  <th className="py-3.5 px-4 text-right">
                    <T k="kpiAlertColApprovalStatus" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployees.map((e) => (
                  <tr key={e.evaluation_id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">{e.employee_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDeptName(e.department_name, t)}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-black text-foreground">
                        {formatCareerLevel(e.career_level, t)}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-semibold">
                        ${e.fixed_salary.toLocaleString(localeCode)} {t('kpiAlertPerMonth')}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 min-w-[140px]">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span>${e.total_sales.toLocaleString(localeCode)}</span>
                        <span
                          className={
                            e.is_plan_achieved
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {e.plan_progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            e.is_plan_achieved ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, e.plan_progress_percentage)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-foreground">
                        ${Math.round(e.average_check).toLocaleString(localeCode)} {t('kpiAlertAvg')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('kpiAlertDealsCount', { count: e.deal_count })} •{' '}
                        {e.is_sr_check_achieved
                          ? t('kpiAlertSrCheckAchieved')
                          : t('kpiAlertSrCheckMissed')}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-black text-emerald-600 dark:text-emerald-400">
                        ${e.sales_bonus_amount.toLocaleString(localeCode)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {t('kpiAlertBonusPaidUnpaid', {
                          paid: e.paid_sales_bonus_amount.toLocaleString(localeCode),
                          unpaid: e.unpaid_sales_bonus_amount.toLocaleString(localeCode),
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-black text-foreground">
                        ${e.total_earnings.toLocaleString(localeCode)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        <T k="kpiAlertBasePlusBonus" />
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {e.consecutive_successes > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          {t('kpiAlertSuccessMonthsShort', { count: e.consecutive_successes })}
                        </span>
                      ) : e.consecutive_failures > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                          {t('kpiAlertFailedMonthsShort', { count: e.consecutive_failures })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          e.approval_status.includes('APPROVED')
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : e.approval_status.includes('PENDING')
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {formatApprovalStatus(e.approval_status, t)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 7. TAB 3: CAREER LEVEL & BASE SALARY MATRIX GUIDE                 */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'career-matrix' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-surface border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand-gold" />
              <span>
                <T k="kpiAlertMatrixTitle" />
              </span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <T k="kpiAlertMatrixDesc" />
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-extrabold text-[10px] tracking-wider">
                    <th className="py-3 px-3">
                      <T k="kpiAlertMatrixColRank" />
                    </th>
                    <th className="py-3 px-3">
                      <T k="kpiAlertMatrixColSalary" />
                    </th>
                    <th className="py-3 px-3">
                      <T k="kpiAlertMatrixColTarget" />
                    </th>
                    <th className="py-3 px-3">
                      <T k="kpiAlertMatrixColSrCheck" />
                    </th>
                    <th className="py-3 px-3">
                      <T k="kpiAlertMatrixColPromo" />
                    </th>
                    <th className="py-3 px-3">
                      <T k="kpiAlertMatrixColDemo" />
                    </th>
                    <th className="py-3 px-3">
                      <T k="kpiAlertMatrixColNext" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 px-3 font-bold text-blue-500">{t('careerLevelJunior')}</td>
                    <td className="py-3 px-3 font-extrabold text-foreground">$300</td>
                    <td className="py-3 px-3 text-muted-foreground">$0 – $3,000</td>
                    <td className="py-3 px-3 font-semibold text-foreground">$150</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      <T k="kpiAlertMatrix2Months" />
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      <T k="kpiAlertMatrixNaBase" />
                    </td>
                    <td className="py-3 px-3 font-bold text-brand-gold">{t('careerLevelMid')}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-brand-gold">{t('careerLevelMid')}</td>
                    <td className="py-3 px-3 font-extrabold text-foreground">$500</td>
                    <td className="py-3 px-3 text-muted-foreground">$5,000 – $6,000</td>
                    <td className="py-3 px-3 font-semibold text-foreground">$200</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      <T k="kpiAlertMatrix3Months" />
                    </td>
                    <td className="py-3 px-3 text-rose-500 font-semibold">
                      <T k="kpiAlertMatrix2Missed" />
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-500">
                      {t('careerLevelSenior')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-emerald-500">
                      {t('careerLevelSenior')}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-foreground">$700</td>
                    <td className="py-3 px-3 text-muted-foreground">$6,001 – $8,000</td>
                    <td className="py-3 px-3 font-semibold text-foreground">$250</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      <T k="kpiAlertMatrix4Months" />
                    </td>
                    <td className="py-3 px-3 text-rose-500 font-semibold">
                      <T k="kpiAlertMatrix2Missed" />
                    </td>
                    <td className="py-3 px-3 font-bold text-purple-500">
                      {t('careerLevelExpert')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-purple-500">
                      {t('careerLevelExpert')}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-foreground">$1,000</td>
                    <td className="py-3 px-3 text-muted-foreground">$8,001 – $10,000</td>
                    <td className="py-3 px-3 font-semibold text-foreground">$300</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      <T k="kpiAlertMatrixNaTop" />
                    </td>
                    <td className="py-3 px-3 text-rose-500 font-semibold">
                      <T k="kpiAlertMatrix3Missed" />
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      <T k="kpiAlertMatrixNone" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 8. MODALS                                                         */}
      {/* ----------------------------------------------------------------- */}
      <DecisionModal
        isOpen={isDecisionModalOpen}
        suggestion={activeSuggestion}
        defaultAction={activeDecisionAction}
        onClose={() => {
          setIsDecisionModalOpen(false);
          setActiveSuggestion(null);
        }}
        onConfirm={handleExecuteDecision}
      />

      <BulkDecisionModal
        isOpen={isBulkModalOpen}
        selectedSuggestions={selectedSuggestionsList}
        currentMonth={currentMonth}
        onClose={() => setIsBulkModalOpen(false)}
        onConfirm={handleExecuteBulk}
      />

      <MonthEndReviewModal
        isOpen={isReviewModalOpen}
        popupData={data}
        onClose={() => setIsReviewModalOpen(false)}
        onDecide={(s, action) => {
          setIsReviewModalOpen(false);
          handleOpenDecisionModal(s, action);
        }}
        onDismiss={handleDismissAlert}
        onNavigateToFullPage={() => {
          setIsReviewModalOpen(false);
          setActiveTab('suggestions');
        }}
      />
    </div>
  );
}
