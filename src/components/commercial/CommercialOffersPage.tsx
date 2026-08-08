import { useState, useEffect, useCallback } from 'react';
import { Card, Spinner } from '@heroui/react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Copy,
  Eye,
  Edit3,
  Trash2,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Building2,
} from 'lucide-react';
import { usePermissions } from '../../context/PermissionsContext';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from '../../context/LanguageContext';
import { commercialOffersApi } from '../../services/commercialOffers.service';
import { downloadCommercialOfferPdfBlob, type PdfLanguage } from '../../utils/pdfGenerator';
import { CommercialOfferStatusBadge } from './CommercialOfferStatusBadge';
import { CommercialOfferFormModal } from './CommercialOfferFormModal';
import { CommercialOfferDetailModal } from './CommercialOfferDetailModal';
import type {
  CommercialOffer,
  CommercialOfferStatus,
  CommercialOfferStats,
  CreateCommercialOfferDto,
  UpdateCommercialOfferDto,
} from '../../types/commercialOffers';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function CommercialOffersPage() {
  const { t, locale } = useTranslation();
  const { showNotification } = useNotification();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<CommercialOfferStats | null>(null);
  const [offers, setOffers] = useState<CommercialOffer[]>([]);
  
  // Pagination & Filtering state
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const limit = 12;

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<CommercialOffer | null>(null);
  const [editOffer, setEditOffer] = useState<CommercialOffer | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await commercialOffersApi.getStatsSummary();
      setStats(data);
    } catch (err) {
      console.warn('Failed to load commercial offer stats:', err);
    }
  }, []);

  // Fetch Offers List
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await commercialOffersApi.list({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setOffers(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch (err: any) {
      showNotification(err?.message || t('errorLoadingOffers'), 'warning');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, dateFrom, dateTo, showNotification, t]);

  useEffect(() => {
    fetchStats();
    fetchOffers();
  }, [fetchStats, fetchOffers]);

  // Handle Create / Update Offer submit
  const handleFormSubmit = async (dto: CreateCommercialOfferDto) => {
    setFormSubmitting(true);
    try {
      if (editOffer) {
        await commercialOffersApi.update(editOffer.id, dto as UpdateCommercialOfferDto);
        showNotification(t('successOfferUpdated'), 'success');
      } else {
        await commercialOffersApi.create(dto);
        showNotification(t('successOfferCreated'), 'success');
      }
      fetchStats();
      fetchOffers();
      setIsFormModalOpen(false);
      setEditOffer(null);
    } catch (err: any) {
      showNotification(err?.message || 'Error saving commercial offer', 'warning');
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (id: string, newStatus: CommercialOfferStatus) => {
    try {
      const updated = await commercialOffersApi.updateStatus(id, newStatus);
      showNotification(`${t('offerStatusUpdated')}: ${newStatus.toUpperCase()}`, 'success');
      if (selectedOffer && selectedOffer.id === id) {
        setSelectedOffer(updated);
      }
      fetchStats();
      fetchOffers();
    } catch (err: any) {
      showNotification(err?.message || 'Invalid status transition', 'warning');
      throw err;
    }
  };

  // Handle One-Click Duplication
  const handleDuplicate = async (id: string) => {
    try {
      const dup = await commercialOffersApi.duplicate(id);
      showNotification(`${t('successOfferDuplicated')}: ${dup.offer_number}`, 'success');
      fetchStats();
      fetchOffers();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to duplicate proposal', 'warning');
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async (id: string) => {
    try {
      await commercialOffersApi.delete(id);
      showNotification(t('successOfferDeleted'), 'success');
      setDeleteConfirmId(null);
      fetchStats();
      fetchOffers();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete offer', 'warning');
    }
  };

  // Handle PDF Export
  const handleDownloadPdf = async (offer: CommercialOffer, lang?: PdfLanguage) => {
    try {
      const targetLang = lang || (locale as PdfLanguage) || 'ru';
      showNotification(`${t('downloadingPdf')}: ${offer.offer_number} (${targetLang.toUpperCase()})...`, 'info');
      downloadCommercialOfferPdfBlob(offer, targetLang);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to download PDF', 'warning');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const statCards = [
    {
      key: 'offerTotalOffers',
      label: t('offerTotalOffers'),
      value: stats?.total_offers || 0,
      icon: <FileText className="size-5" />,
      color: 'text-brand-gold',
      bgColor: 'bg-brand-gold/15',
    },
    {
      key: 'offerStatusDraft',
      label: t('offerStatusDraft'),
      value: stats?.by_status.draft || 0,
      icon: <Clock className="size-5" />,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/15',
    },
    {
      key: 'offerStatusSent',
      label: t('offerStatusSent'),
      value: stats?.by_status.sent || 0,
      icon: <TrendingUp className="size-5" />,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/15',
    },
    {
      key: 'offerStatusAccepted',
      label: t('offerStatusAccepted'),
      value: stats?.by_status.accepted || 0,
      icon: <CheckCircle2 className="size-5" />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/15',
    },
    {
      key: 'offerStatusRejected',
      label: t('offerStatusRejected'),
      value: stats?.by_status.rejected || 0,
      icon: <XCircle className="size-5" />,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/15',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 w-full"
    >
      {/* Header & Main Actions */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground flex items-center gap-2.5">
            <FileText className="size-6 text-brand-gold" />
            <span>{t('commercialOffersTitle')}</span>
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {t('commercialOffersSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchStats(); fetchOffers(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-foreground font-semibold text-xs border border-border transition-colors cursor-pointer"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('actionRetry')}</span>
          </button>

          {canCreate('commercial_offers') && (
            <button
              onClick={() => { setEditOffer(null); setIsFormModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs shadow-md hover:bg-brand-gold/90 transition-all cursor-pointer"
            >
              <Plus className="size-4" />
              <span>{t('offerCreateBtn')}</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* KPI Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {statCards.map((sc) => (
          <Card
            key={sc.key}
            onClick={() => {
              if (sc.key.startsWith('offerStatus')) {
                const statusKey = sc.key.replace('offerStatus', '').toLowerCase();
                setStatusFilter(statusFilter === statusKey ? '' : statusKey);
                setPage(1);
              }
            }}
            className={`p-4 border bg-surface rounded-2xl cursor-pointer transition-all duration-200 ${
              statusFilter && sc.key.toLowerCase().includes(statusFilter)
                ? 'border-brand-gold ring-2 ring-brand-gold/20 shadow-md'
                : 'border-border/40 hover:border-brand-gold/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl ${sc.bgColor} flex items-center justify-center ${sc.color} shrink-0`}>
                {sc.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted truncate">{sc.label}</span>
                <span className="text-xl font-bold text-foreground tracking-tight">{sc.value}</span>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Revenue Card Banner */}
      {stats?.accepted_revenue && (
        <motion.div variants={itemVariants}>
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white border border-brand-royal/40 flex flex-wrap items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
                <DollarSign className="size-5" />
              </div>
              <div>
                <span className="text-xs text-brand-gold font-bold uppercase tracking-wider block">
                  {t('acceptedRevenueTotal')}
                </span>
                <span className="text-2xl font-bold font-serif text-white">
                  ${stats.accepted_revenue.total_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-neutral-400 block">Total Local Currency (UZS)</span>
              <span className="text-base font-bold text-brand-gold">
                {stats.accepted_revenue.total_local.toLocaleString('uz-UZ')} UZS
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter Toolbar */}
      <motion.div variants={itemVariants} className="p-4 rounded-2xl bg-surface border border-border/40 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('offerSearchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
            />
            <Search className="size-4 text-muted absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Status Select */}
          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
            >
              <option value="">{t('statusAll')} ({t('offerStatusAll')})</option>
              <option value="draft">Drafts ({t('offerStatusDraft')})</option>
              <option value="sent">Sent ({t('offerStatusSent')})</option>
              <option value="accepted">Accepted ({t('offerStatusAccepted')})</option>
              <option value="rejected">Rejected ({t('offerStatusRejected')})</option>
            </select>
          </div>

          {/* Date From */}
          <div className="lg:col-span-2 relative">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none"
            />
          </div>

          {/* Date To */}
          <div className="lg:col-span-2 relative">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none"
            />
          </div>

          {/* Controls */}
          <div className="lg:col-span-1 flex items-center gap-1 justify-end">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              className="p-2 rounded-xl border border-border text-muted hover:text-foreground hover:bg-muted/40 transition-colors"
              title={viewMode === 'table' ? 'Grid View' : 'Table View'}
            >
              {viewMode === 'table' ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
            </button>

            {(search || statusFilter || dateFrom || dateTo) && (
              <button
                onClick={handleResetFilters}
                className="p-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors"
                title="Reset Filters"
              >
                <Filter className="size-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content Area: Table / Grid */}
      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted">
            <Spinner size="lg" />
            <p className="text-xs font-medium">{t('loadingTransactions')}</p>
          </div>
        ) : offers.length === 0 ? (
          <Card className="p-12 text-center bg-surface border border-border/40 rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="size-12 rounded-full bg-brand-gold/15 flex items-center justify-center text-brand-gold">
              <FileText className="size-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">{t('noOffersFound')}</h3>
            <p className="text-xs text-muted max-w-sm leading-relaxed">{t('noOffersDesc')}</p>
            {canCreate('commercial_offers') && (
              <button
                onClick={() => { setEditOffer(null); setIsFormModalOpen(true); }}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs shadow-md hover:bg-brand-gold/90 transition-all cursor-pointer"
              >
                <Plus className="size-4" />
                <span>{t('offerCreateBtn')}</span>
              </button>
            )}
          </Card>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="w-full overflow-x-auto rounded-2xl border border-border/40 bg-surface shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">{t('colOfferNumber')}</th>
                  <th className="py-3.5 px-4">{t('colClient')}</th>
                  <th className="py-3.5 px-4">{t('colRoute')}</th>
                  <th className="py-3.5 px-4">{t('colPriceUsd')}</th>
                  <th className="py-3.5 px-4">{t('colPriceLocal')}</th>
                  <th className="py-3.5 px-4">{t('colStatus')}</th>
                  <th className="py-3.5 px-4 text-right">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{offer.offer_number}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground truncate max-w-[180px]">
                          {offer.client_name}
                        </span>
                        <span className="text-[10px] text-muted truncate max-w-[180px]">
                          {offer.client_company}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 text-foreground font-semibold text-[11px]">
                        <span>{offer.origin}</span>
                        <span className="text-brand-gold font-bold">➔</span>
                        <span>{offer.destination}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">
                      ${offer.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-muted whitespace-nowrap">
                      {offer.price_local.toLocaleString('uz-UZ')} UZS
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <CommercialOfferStatusBadge status={offer.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedOffer(offer); setIsDetailModalOpen(true); }}
                          className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors"
                          title="View Details"
                        >
                          <Eye className="size-4" />
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(offer)}
                          className="p-1.5 rounded-lg text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="size-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(offer.id)}
                          className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted/60 transition-colors"
                          title="One-Click Duplicate"
                        >
                          <Copy className="size-4" />
                        </button>

                        {canUpdate('commercial_offers') && (
                          <button
                            onClick={() => { setEditOffer(offer); setIsFormModalOpen(true); }}
                            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted/60 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="size-4" />
                          </button>
                        )}

                        {canDelete('commercial_offers') && (
                          <button
                            onClick={() => setDeleteConfirmId(offer.id)}
                            className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <Card
                key={offer.id}
                className="p-5 border border-border/40 bg-surface rounded-2xl hover:border-brand-gold/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Row: Offer Number & Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{offer.offer_number}</span>
                    <CommercialOfferStatusBadge status={offer.status} size="sm" />
                  </div>

                  {/* Route Visual */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between text-xs font-bold">
                    <span className="truncate">{offer.origin}</span>
                    <span className="text-brand-gold text-sm px-2">➔</span>
                    <span className="truncate text-right">{offer.destination}</span>
                  </div>

                  {/* Client Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Building2 className="size-3.5 text-brand-gold shrink-0" />
                      <span className="truncate">{offer.client_name}</span>
                    </div>
                    <p className="text-[11px] text-muted truncate pl-5">{offer.client_company}</p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted uppercase font-bold block">Proposal Total</span>
                      <span className="text-base font-bold text-foreground">
                        ${offer.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span className="text-xs text-brand-gold font-semibold">
                      {offer.price_local.toLocaleString('uz-UZ')} UZS
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => { setSelectedOffer(offer); setIsDetailModalOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Eye className="size-3.5" />
                    <span>Details</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(offer)}
                    className="p-2 rounded-xl bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                    title="Download PDF"
                  >
                    <Download className="size-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(offer.id)}
                    className="p-2 rounded-xl bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <motion.div variants={itemVariants} className="flex items-center justify-between px-2 py-3 border-t border-border/40">
          <span className="text-xs text-muted">
            {t('showingTransactions').replace('{count}', String(offers.length)).replace('{total}', String(totalItems))}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-muted/40 hover:bg-muted/70 border border-border text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t('pagPrev')}
            </button>

            <span className="text-xs font-bold text-foreground px-2">
              {t('pageIndicator').replace('{page}', String(page)).replace('{totalPages}', String(totalPages))}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-muted/40 hover:bg-muted/70 border border-border text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t('pagNext')}
            </button>
          </div>
        </motion.div>
      )}

      {/* Modal: Create & Edit Offer */}
      <CommercialOfferFormModal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditOffer(null); }}
        onSubmit={handleFormSubmit}
        initialData={editOffer}
        loading={formSubmitting}
      />

      {/* Modal: View Offer Details */}
      <CommercialOfferDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        offer={selectedOffer}
        onUpdateStatus={handleUpdateStatus}
        onDuplicate={handleDuplicate}
        onEdit={(off) => { setEditOffer(off); setIsFormModalOpen(true); }}
        onDelete={(id) => setDeleteConfirmId(id)}
        onDownloadPdf={handleDownloadPdf}
        canUpdate={canUpdate('commercial_offers')}
        canDelete={canDelete('commercial_offers')}
      />

      {/* Modal: Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-surface border border-border shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="size-10 rounded-full bg-rose-500/15 flex items-center justify-center">
                <Trash2 className="size-5" />
              </div>
              <h3 className="text-lg font-bold font-serif text-foreground">{t('offerDeleteTitle')}</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {t('offerDeleteDesc')}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted hover:text-foreground cursor-pointer"
              >
                {t('actionCancel')}
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors shadow cursor-pointer"
              >
                {t('actionDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
