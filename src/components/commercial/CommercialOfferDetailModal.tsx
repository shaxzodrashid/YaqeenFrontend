import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Printer,
  Copy,
  Edit3,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Building2,
  MapPin,
  Package,
  FileText,
  Loader2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { CommercialOfferStatusBadge } from './CommercialOfferStatusBadge';
import { validateOfferStatusTransition } from '../../services/commercialOffers.service';
import type { CommercialOffer, CommercialOfferStatus } from '../../types/commercialOffers';
import { openCommercialOfferPdfPrintWindow, type PdfLanguage } from '../../utils/pdfGenerator';

interface CommercialOfferDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: CommercialOffer | null;
  onUpdateStatus: (id: string, status: CommercialOfferStatus) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onEdit: (offer: CommercialOffer) => void;
  onDelete: (id: string) => void;
  onDownloadPdf: (offer: CommercialOffer, lang: PdfLanguage) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function CommercialOfferDetailModal({
  isOpen,
  onClose,
  offer,
  onUpdateStatus,
  onDuplicate,
  onEdit,
  onDelete,
  onDownloadPdf,
  canUpdate = true,
  canDelete = true,
}: CommercialOfferDetailModalProps) {
  const { t, locale } = useTranslation();
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [duplicating, setDuplicating] = useState<boolean>(false);
  const [pdfLang, setPdfLang] = useState<PdfLanguage>((locale as PdfLanguage) || 'ru');

  if (!isOpen || !offer) return null;

  const formattedUsd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(offer.price_usd);
  const formattedLocal = new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(offer.price_local);

  const dateStr = new Date(offer.created_at || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleStatusChange = async (targetStatus: CommercialOfferStatus) => {
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(offer.id, targetStatus);
    } catch (err: any) {
      console.error('Failed to transition offer status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDuplicateClick = async () => {
    setDuplicating(true);
    try {
      await onDuplicate(offer.id);
      onClose();
    } catch (err) {
      console.error('Failed to duplicate offer:', err);
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-4xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
        >
          {/* Top Bar Header */}
          <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-border bg-muted/20 gap-3">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-brand-navy border border-brand-gold/40 flex items-center justify-center text-brand-gold shrink-0">
                <FileText className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-serif text-foreground">
                    {offer.offer_number}
                  </h2>
                  <CommercialOfferStatusBadge status={offer.status} size="sm" />
                </div>
                <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                  <Calendar className="size-3.5" /> {dateStr}
                  {offer.creator_name && (
                    <>
                      <span>&bull;</span>
                      <UserCheck className="size-3.5 text-brand-gold" /> {offer.creator_name}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* PDF Language Switcher Pills */}
              <div className="flex items-center bg-muted/70 p-1 rounded-xl border border-border/60 text-[11px] font-bold">
                <button
                  onClick={() => setPdfLang('uz')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    pdfLang === 'uz'
                      ? 'bg-brand-gold text-brand-navy shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="O'zbekcha Taklif"
                >
                  UZ
                </button>
                <button
                  onClick={() => setPdfLang('ru')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    pdfLang === 'ru'
                      ? 'bg-brand-gold text-brand-navy shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="Русское Предложение"
                >
                  RU
                </button>
                <button
                  onClick={() => setPdfLang('en')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    pdfLang === 'en'
                      ? 'bg-brand-gold text-brand-navy shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="English Offer"
                >
                  EN
                </button>
              </div>

              {/* Download PDF Button */}
              <button
                onClick={() => onDownloadPdf(offer, pdfLang)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 hover:bg-brand-gold/25 transition-colors text-xs font-bold cursor-pointer"
                title={`Download Official PDF in ${pdfLang.toUpperCase()}`}
              >
                <Download className="size-3.5" />
                <span>PDF ({pdfLang.toUpperCase()})</span>
              </button>

              {/* Print PDF Button */}
              <button
                onClick={() => openCommercialOfferPdfPrintWindow(offer, pdfLang)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 hover:bg-sky-500/25 transition-colors text-xs font-bold cursor-pointer"
                title={`Print Commercial Offer in ${pdfLang.toUpperCase()}`}
              >
                <Printer className="size-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDuplicateClick}
                disabled={duplicating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors text-xs font-bold cursor-pointer disabled:opacity-50"
                title="Duplicate proposal into new draft"
              >
                {duplicating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{t('actionDuplicate')}</span>
              </button>

              {canUpdate && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(offer);
                  }}
                  className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                  title="Edit Offer"
                >
                  <Edit3 className="size-4" />
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => {
                    onClose();
                    onDelete(offer.id);
                  }}
                  className="p-2 rounded-xl text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete Offer"
                >
                  <Trash2 className="size-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Modal Body / Proposal Sheet */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Status Lifecycle Transition Action Bar */}
            {canUpdate && (
              <div className="p-4 rounded-xl bg-muted/20 border border-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Lifecycle Status Actions:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Transition: Draft -> Sent */}
                  {validateOfferStatusTransition(offer.status, 'sent') &&
                    offer.status !== 'sent' && (
                      <button
                        onClick={() => handleStatusChange('sent')}
                        disabled={updatingStatus}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/25 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Send className="size-3.5" />
                        <span>{t('btnMarkSent')}</span>
                      </button>
                    )}

                  {/* Transition: Draft/Sent -> Accepted */}
                  {validateOfferStatusTransition(offer.status, 'accepted') &&
                    offer.status !== 'accepted' && (
                      <button
                        onClick={() => handleStatusChange('accepted')}
                        disabled={updatingStatus}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>{t('btnMarkAccepted')}</span>
                      </button>
                    )}

                  {/* Transition: Draft/Sent -> Rejected */}
                  {validateOfferStatusTransition(offer.status, 'rejected') &&
                    offer.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange('rejected')}
                        disabled={updatingStatus}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/25 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="size-3.5" />
                        <span>{t('btnMarkRejected')}</span>
                      </button>
                    )}

                  {/* Transition: Sent/Accepted/Rejected -> Reopen Draft */}
                  {validateOfferStatusTransition(offer.status, 'draft') &&
                    offer.status !== 'draft' && (
                      <button
                        onClick={() => handleStatusChange('draft')}
                        disabled={updatingStatus}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>{t('btnReopenDraft')}</span>
                      </button>
                    )}

                  {updatingStatus && <Loader2 className="size-4 animate-spin text-brand-gold" />}
                </div>
              </div>
            )}

            {/* Route Visual Card */}
            <div className="relative rounded-2xl bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white p-6 border border-brand-royal/40 shadow-lg overflow-hidden">
              <div className="text-[10px] font-bold tracking-widest text-brand-gold uppercase mb-3">
                Freight Transport Route Proposal
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 uppercase font-medium block">
                      Origin
                    </span>
                    <span className="text-lg font-bold text-white">{offer.origin}</span>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="w-full h-0.5 bg-gradient-to-r from-brand-gold/20 via-brand-gold to-brand-gold/20 relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-6 rounded-full bg-brand-gold text-brand-navy flex items-center justify-center text-xs font-bold shadow">
                      ➔
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-xs text-neutral-400 uppercase font-medium block">
                      Destination
                    </span>
                    <span className="text-lg font-bold text-white">{offer.destination}</span>
                  </div>
                  <div className="size-10 rounded-xl bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
                    <MapPin className="size-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Info Grid: Client & Cargo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Card */}
              <div className="p-5 rounded-xl bg-muted/20 border border-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-border/40 pb-2">
                  <Building2 className="size-4" />
                  <span>Client Information</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact Person:</span>
                    <span className="font-bold text-foreground">{offer.client_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company Name:</span>
                    <span className="font-bold text-foreground">{offer.client_company}</span>
                  </div>
                </div>
              </div>

              {/* Cargo Specs */}
              <div className="p-5 rounded-xl bg-muted/20 border border-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-border/40 pb-2">
                  <Package className="size-4" />
                  <span>Cargo Specifications</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cargo Description:</span>
                    <span className="font-bold text-foreground">
                      {offer.cargo_description || 'General Freight'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-bold text-foreground">
                      {offer.cargo_weight !== null && offer.cargo_weight !== undefined
                        ? `${offer.cargo_weight} kg`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume:</span>
                    <span className="font-bold text-foreground">
                      {offer.cargo_volume !== null && offer.cargo_volume !== undefined
                        ? `${offer.cargo_volume} m³`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Summary Banner */}
            <div className="p-5 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-gold block">
                  Total Proposal Price
                </span>
                <span className="text-2xl font-bold font-serif text-foreground">
                  {formattedUsd}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Equivalent Local Price</span>
                <span className="text-lg font-bold text-brand-gold">{formattedLocal}</span>
              </div>
            </div>

            {/* Inclusions & Exclusions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inclusions */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  ✓ Included Services
                </span>
                {offer.inclusions && offer.inclusions.length > 0 ? (
                  <ul className="space-y-1 text-xs text-foreground">
                    {offer.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span> {inc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted italic">Standard transport included</p>
                )}
              </div>

              {/* Exclusions */}
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                  ✗ Excluded Services
                </span>
                {offer.exclusions && offer.exclusions.length > 0 ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {offer.exclusions.map((exc, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-rose-500 font-bold">✗</span> {exc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted italic">No exclusions specified</p>
                )}
              </div>
            </div>

            {/* Payment Terms */}
            {offer.terms && (
              <div className="p-4 rounded-xl bg-muted/20 border-l-4 border-brand-gold space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                  Terms & Payment Policy
                </span>
                <p className="text-xs text-muted leading-relaxed">{offer.terms}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
