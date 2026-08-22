import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Building2,
  MapPin,
  DollarSign,
  Package,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { ClientSelect } from '../cargo/ClientSelect';
import { CitySelect } from '../cargo/CitySelect';
import type { CommercialOffer, CreateCommercialOfferDto } from '../../types/commercialOffers';
import type { Client } from '../../services/clients.service';

interface CommercialOfferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateCommercialOfferDto) => Promise<void>;
  initialData?: CommercialOffer | null;
  loading?: boolean;
}

export function CommercialOfferFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: CommercialOfferFormModalProps) {
  const { t } = useTranslation();

  const [clientId, setClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientCompany, setClientCompany] = useState<string>('');
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [cargoDescription, setCargoDescription] = useState<string>('');
  const [cargoWeight, setCargoWeight] = useState<string>('');
  const [cargoVolume, setCargoVolume] = useState<string>('');
  const [priceUsd, setPriceUsd] = useState<string>('');
  const [priceLocal, setPriceLocal] = useState<string>('');
  const [terms, setTerms] = useState<string>('');
  const [inclusions, setInclusions] = useState<string[]>(['Freight transport', 'Insurance']);
  const [exclusions, setExclusions] = useState<string[]>(['Customs duties']);

  const [newInclusion, setNewInclusion] = useState<string>('');
  const [newExclusion, setNewExclusion] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.client_id || '');
      setClientName(initialData.client_name || '');
      setClientCompany(initialData.client_company || '');
      setOrigin(initialData.origin || '');
      setDestination(initialData.destination || '');
      setCargoDescription(initialData.cargo_description || '');
      setCargoWeight(
        initialData.cargo_weight !== null && initialData.cargo_weight !== undefined
          ? String(initialData.cargo_weight)
          : ''
      );
      setCargoVolume(
        initialData.cargo_volume !== null && initialData.cargo_volume !== undefined
          ? String(initialData.cargo_volume)
          : ''
      );
      setPriceUsd(initialData.price_usd !== undefined ? String(initialData.price_usd) : '');
      setPriceLocal(initialData.price_local !== undefined ? String(initialData.price_local) : '');
      setTerms(initialData.terms || '');
      setInclusions(initialData.inclusions || ['Freight transport']);
      setExclusions(initialData.exclusions || ['Customs duties']);
    } else {
      setClientId('');
      setClientName('');
      setClientCompany('');
      setOrigin('');
      setDestination('');
      setCargoDescription('');
      setCargoWeight('');
      setCargoVolume('');
      setPriceUsd('');
      setPriceLocal('');
      setTerms('50% advance upon contract signing, 50% upon delivery');
      setInclusions(['International freight transport', 'Cargo insurance']);
      setExclusions(['Import customs duties & taxes']);
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  // When ClientSelect picks a client, auto-fill contact name & company name
  const handleClientSelect = (id: string, name: string, clientObj?: Client) => {
    setClientId(id);
    if (clientObj) {
      const fullName = `${clientObj.first_name || ''} ${clientObj.last_name || ''}`.trim();
      setClientName(fullName || name);
      setClientCompany(clientObj.company_name || '');
    } else if (name) {
      setClientName(name);
    }
  };

  const handleAddInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions((prev) => [...prev, newInclusion.trim()]);
      setNewInclusion('');
    }
  };

  const handleRemoveInclusion = (index: number) => {
    setInclusions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddExclusion = () => {
    if (newExclusion.trim()) {
      setExclusions((prev) => [...prev, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  const handleRemoveExclusion = (index: number) => {
    setExclusions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clientName.trim()) {
      setErrorMsg('Client name is required');
      return;
    }
    if (!clientCompany.trim()) {
      setErrorMsg('Client company is required');
      return;
    }
    if (!origin.trim()) {
      setErrorMsg('Origin location is required');
      return;
    }
    if (!destination.trim()) {
      setErrorMsg('Destination location is required');
      return;
    }
    const parsedUsd = parseFloat(priceUsd);
    if (isNaN(parsedUsd) || parsedUsd < 0) {
      setErrorMsg('Valid USD price is required');
      return;
    }
    const parsedLocal = parseFloat(priceLocal);
    if (isNaN(parsedLocal) || parsedLocal < 0) {
      setErrorMsg('Valid local (UZS) price is required');
      return;
    }

    const payload: CreateCommercialOfferDto = {
      client_id: clientId || undefined,
      client_name: clientName.trim(),
      client_company: clientCompany.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      cargo_description: cargoDescription.trim() || undefined,
      cargo_weight: cargoWeight ? parseFloat(cargoWeight) : undefined,
      cargo_volume: cargoVolume ? parseFloat(cargoVolume) : undefined,
      price_usd: parsedUsd,
      price_local: parsedLocal,
      inclusions,
      exclusions,
      terms: terms.trim() || undefined,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save commercial offer');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-3xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                <FileText className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-foreground">
                  {initialData ? t('offerEditTitle') : t('offerCreateTitle')}
                </h2>
                <p className="text-xs text-muted">
                  {initialData ? initialData.offer_number : t('offerCreateSubtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Client Integration Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-border/40 pb-1">
                <Building2 className="size-4" />
                <span>{t('lblClientDetails')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <ClientSelect
                    value={clientId}
                    onChange={handleClientSelect}
                    label={t('lblSelectClientDirectory')}
                    placeholder={t('lblClientSelectPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('clientName')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Rustam Rasulov"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('clientCompany')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="e.g. Orient Cargo LLC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                  />
                </div>
              </div>
            </div>

            {/* 2. Route & Logistics Scope */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-border/40 pb-1">
                <MapPin className="size-4" />
                <span>{t('lblRouteScope')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CitySelect
                    label={`${t('offerOrigin') || 'Origin'} *`}
                    placeholder="Search origin hub (e.g. Tashkent, Shanghai)..."
                    value={origin}
                    onChange={(city, customText) =>
                      setOrigin(
                        city
                          ? `${city.name}${city.country_code ? `, ${city.country_code}` : ''}`
                          : customText || ''
                      )
                    }
                    required
                  />
                </div>

                <div>
                  <CitySelect
                    label={`${t('offerDestination') || 'Destination'} *`}
                    placeholder="Search destination hub (e.g. Samarkand, Guangzhou)..."
                    value={destination}
                    onChange={(city, customText) =>
                      setDestination(
                        city
                          ? `${city.name}${city.country_code ? `, ${city.country_code}` : ''}`
                          : customText || ''
                      )
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* 3. Cargo Specifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-border/40 pb-1">
                <Package className="size-4" />
                <span>{t('lblCargoSpecifications')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('cargoTitle')}
                  </label>
                  <input
                    type="text"
                    value={cargoDescription}
                    onChange={(e) => setCargoDescription(e.target.value)}
                    placeholder="e.g. Microchip components"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('cargoWeight')} (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    placeholder="e.g. 1500.5"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('cargoVolume')} (m³)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cargoVolume}
                    onChange={(e) => setCargoVolume(e.target.value)}
                    placeholder="e.g. 12.3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                  />
                </div>
              </div>
            </div>

            {/* 4. Pricing (USD & UZS) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-border/40 pb-1">
                <DollarSign className="size-4" />
                <span>{t('lblCommercialPricing')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('priceUsd')} ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={priceUsd}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPriceUsd(val);
                      // Auto-convert to UZS at approximate rate 13,000 UZS if empty or zero
                      if (val && (!priceLocal || priceLocal === '0')) {
                        setPriceLocal(String(Math.round(parseFloat(val) * 13000)));
                      }
                    }}
                    placeholder="5000.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('priceLocal')} (UZS) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="1"
                    min="0"
                    value={priceLocal}
                    onChange={(e) => setPriceLocal(e.target.value)}
                    placeholder="65000000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                  />
                </div>
              </div>
            </div>

            {/* 5. Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inclusions */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  ✓ {t('lblInclusions')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInclusion}
                    onChange={(e) => setNewInclusion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInclusion();
                      }
                    }}
                    placeholder="Add included service..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddInclusion}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                  {inclusions.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-foreground"
                    >
                      <span>✓ {item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInclusion(i)}
                        className="text-muted hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  ✗ {t('lblExclusions')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newExclusion}
                    onChange={(e) => setNewExclusion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExclusion();
                      }
                    }}
                    placeholder="Add excluded item..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddExclusion}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/25 transition-colors"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                  {exclusions.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-foreground"
                    >
                      <span>✗ {item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExclusion(i)}
                        className="text-muted hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 6. Terms & Conditions */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('lblPaymentTerms')}
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Specify payment schedule, conditions, or validity period..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
              />
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                {t('actionCancel')}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold text-brand-navy font-bold text-xs hover:bg-brand-gold/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t('actionSaving')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-4" />
                    <span>{initialData ? t('actionSave') : t('actionCreate')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
