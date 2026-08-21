import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, Layers, MapPin, Calendar, DollarSign, Sparkles, Check } from 'lucide-react';
import { T } from '../../T';
import {
  CONSOLIDATION_STATUSES,
  CONSOLIDATION_CONTAINER_PRESETS,
  POPULAR_ORIGIN_CITIES,
  POPULAR_DESTINATION_CITIES,
  cargoConsolidationsApi,
} from '../../../services/api';
import type {
  CargoConsolidation,
  ConsolidationStatus,
  CreateConsolidationDto,
  UpdateConsolidationDto,
  MockCargoRecord,
} from '../../../services/api';

interface ConsolidationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: CargoConsolidation) => void;
  consolidationToEdit?: CargoConsolidation | null;
}

const CURRENCIES = ['USD', 'UZS', 'RUB', 'RMB'];

export function ConsolidationFormModal({
  isOpen,
  onClose,
  onSuccess,
  consolidationToEdit,
}: ConsolidationFormModalProps) {
  const isEditing = !!consolidationToEdit;

  // Form states
  const [consolidationCode, setConsolidationCode] = useState('');
  const [containerTruckId, setContainerTruckId] = useState('');
  const [containerType, setContainerType] = useState('86m3');
  const [maxVolumeCapacity, setMaxVolumeCapacity] = useState('86');
  const [maxWeightCapacity, setMaxWeightCapacity] = useState('22000');
  const [carrierName, setCarrierName] = useState('');
  const [carrierPhone, setCarrierPhone] = useState('');
  const [originPlace, setOriginPlace] = useState('Istanbul, Turkey');
  const [destinationPlace, setDestinationPlace] = useState('Tashkent, Uzbekistan');
  const [loadedDate, setLoadedDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [estimatedArrivalDate, setEstimatedArrivalDate] = useState('');
  const [arrivedDate, setArrivedDate] = useState('');
  const [totalCarrierCost, setTotalCarrierCost] = useState('0');
  const [carrierCostCurrency, setCarrierCostCurrency] = useState('USD');
  const [status, setStatus] = useState<ConsolidationStatus>('Planning');
  const [description, setDescription] = useState('');

  // Cascade options for editing
  const [syncStatusToCargos, setSyncStatusToCargos] = useState(true);
  const [syncDatesToCargos, setSyncDatesToCargos] = useState(true);

  // Available cargos pool for initial attachment (on create)
  const [availableCargos, setAvailableCargos] = useState<MockCargoRecord[]>([]);
  const [selectedCargoIds, setSelectedCargoIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (consolidationToEdit) {
        setConsolidationCode(consolidationToEdit.consolidation_code || '');
        setContainerTruckId(consolidationToEdit.container_truck_id || '');
        setContainerType(consolidationToEdit.container_type || '86m3');
        setMaxVolumeCapacity(String(consolidationToEdit.max_volume_capacity || 86));
        setMaxWeightCapacity(String(consolidationToEdit.max_weight_capacity || 22000));
        setCarrierName(consolidationToEdit.carrier_name || '');
        setCarrierPhone(consolidationToEdit.carrier_phone || '');
        setOriginPlace(consolidationToEdit.origin_place || 'Istanbul, Turkey');
        setDestinationPlace(consolidationToEdit.destination_place || 'Tashkent, Uzbekistan');
        setLoadedDate(consolidationToEdit.loaded_date || '');
        setDepartureDate(consolidationToEdit.departure_date || '');
        setEstimatedArrivalDate(consolidationToEdit.estimated_arrival_date || '');
        setArrivedDate(consolidationToEdit.arrived_date || '');
        setTotalCarrierCost(String(consolidationToEdit.total_carrier_cost || 0));
        setCarrierCostCurrency(consolidationToEdit.carrier_cost_currency || 'USD');
        setStatus(consolidationToEdit.status || 'Planning');
        setDescription(consolidationToEdit.description || '');
        setSyncStatusToCargos(true);
        setSyncDatesToCargos(true);
      } else {
        // Reset for creation
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const rand = Math.floor(1000 + Math.random() * 9000);
        setConsolidationCode(`CNS-${y}${m}-${rand}`);
        setContainerTruckId('');
        setContainerType('86m3');
        setMaxVolumeCapacity('86');
        setMaxWeightCapacity('22000');
        setCarrierName('');
        setCarrierPhone('');
        setOriginPlace('Istanbul, Turkey');
        setDestinationPlace('Tashkent, Uzbekistan');
        setLoadedDate('');
        setDepartureDate('');
        setEstimatedArrivalDate('');
        setArrivedDate('');
        setTotalCarrierCost('0');
        setCarrierCostCurrency('USD');
        setStatus('Planning');
        setDescription('');
        setSelectedCargoIds([]);

        // Fetch unassigned available cargos
        cargoConsolidationsApi
          .getAvailableCargos()
          .then((res) => setAvailableCargos(res))
          .catch(() => {});
      }
      setErrorMsg('');
    }
  }, [isOpen, consolidationToEdit]);

  // Handle Preset Selection
  const applyPreset = (preset: (typeof CONSOLIDATION_CONTAINER_PRESETS)[number]) => {
    setContainerType(preset.type);
    setMaxVolumeCapacity(String(preset.defaultVolume));
    setMaxWeightCapacity(String(preset.defaultWeight));
  };

  const handleCargoCheckboxToggle = (cargoId: string) => {
    setSelectedCargoIds((prev) =>
      prev.includes(cargoId) ? prev.filter((id) => id !== cargoId) : [...prev, cargoId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!containerTruckId.trim()) {
      setErrorMsg('Please enter a vehicle plate number or container ID');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      if (isEditing && consolidationToEdit) {
        const updatePayload: UpdateConsolidationDto = {
          consolidation_code: consolidationCode.trim() || undefined,
          container_truck_id: containerTruckId.trim(),
          container_type: containerType,
          max_volume_capacity: Number(maxVolumeCapacity) || 86,
          max_weight_capacity: Number(maxWeightCapacity) || 22000,
          carrier_name: carrierName.trim(),
          carrier_phone: carrierPhone.trim(),
          origin_place: originPlace.trim(),
          destination_place: destinationPlace.trim(),
          loaded_date: loadedDate || undefined,
          departure_date: departureDate || undefined,
          estimated_arrival_date: estimatedArrivalDate || undefined,
          arrived_date: arrivedDate || undefined,
          total_carrier_cost: Number(totalCarrierCost) || 0,
          carrier_cost_currency: carrierCostCurrency,
          status,
          description: description.trim(),
          sync_status_to_cargos: syncStatusToCargos,
          sync_dates_to_cargos: syncDatesToCargos,
        };

        const res = await cargoConsolidationsApi.update(consolidationToEdit.id, updatePayload);
        onSuccess(res);
        onClose();
      } else {
        const createPayload: CreateConsolidationDto = {
          consolidation_code: consolidationCode.trim() || undefined,
          container_truck_id: containerTruckId.trim(),
          container_type: containerType,
          max_volume_capacity: Number(maxVolumeCapacity) || 86,
          max_weight_capacity: Number(maxWeightCapacity) || 22000,
          carrier_name: carrierName.trim(),
          carrier_phone: carrierPhone.trim(),
          origin_place: originPlace.trim(),
          destination_place: destinationPlace.trim(),
          loaded_date: loadedDate || undefined,
          departure_date: departureDate || undefined,
          estimated_arrival_date: estimatedArrivalDate || undefined,
          arrived_date: arrivedDate || undefined,
          total_carrier_cost: Number(totalCarrierCost) || 0,
          carrier_cost_currency: carrierCostCurrency,
          status,
          description: description.trim(),
          cargo_registration_ids: selectedCargoIds.length > 0 ? selectedCargoIds : undefined,
        };

        const res = await cargoConsolidationsApi.create(createPayload);
        onSuccess(res);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save consolidation trip');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden my-auto"
        >
          {/* Top Accent Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-navy via-brand-gold to-brand-royal shrink-0" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-xs">
                <Truck className="size-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {isEditing ? <T k="cnsModalEditTitle" /> : <T k="cnsModalCreateTitle" />}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isEditing
                    ? `Update vehicle, capacities, carrier and cargo sync for ${consolidationToEdit?.consolidation_code}`
                    : 'Create a new consolidation truck batch and link client LTL loads'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Section 1: Identification & Presets */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                <Truck className="size-3.5" />
                <span>Vehicle & Container Setup</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Truck Plate / Container ID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsTruckPlate" /> <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={containerTruckId}
                    onChange={(e) => setContainerTruckId(e.target.value)}
                    placeholder="e.g. 01A777AA or TRK-9021"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                {/* Consolidation Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsCode" />
                  </label>
                  <input
                    type="text"
                    value={consolidationCode}
                    onChange={(e) => setConsolidationCode(e.target.value)}
                    placeholder="e.g. CNS-202608-0001"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-brand-gold text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>
              </div>

              {/* Quick Container Size Presets */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-muted-foreground">
                  Quick Body / Container Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CONSOLIDATION_CONTAINER_PRESETS.map((preset) => (
                    <button
                      key={preset.type}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        containerType === preset.type
                          ? 'bg-brand-gold text-brand-navy shadow-xs'
                          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/70'
                      }`}
                    >
                      {preset.type} ({preset.defaultVolume} m³)
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume & Weight Limits */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsMaxVolume" />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={maxVolumeCapacity}
                    onChange={(e) => setMaxVolumeCapacity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsMaxWeight" />
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={maxWeightCapacity}
                    onChange={(e) => setMaxWeightCapacity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Carrier & Route */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                <span>Route & Carrier Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Origin */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsOrigin" />
                  </label>
                  <input
                    type="text"
                    value={originPlace}
                    onChange={(e) => setOriginPlace(e.target.value)}
                    placeholder="e.g. Istanbul, Turkey"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                  {/* Origin Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {POPULAR_ORIGIN_CITIES.slice(0, 4).map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setOriginPlace(city)}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        {city.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsDestination" />
                  </label>
                  <input
                    type="text"
                    value={destinationPlace}
                    onChange={(e) => setDestinationPlace(e.target.value)}
                    placeholder="e.g. Tashkent, Uzbekistan"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                  {/* Destination Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {POPULAR_DESTINATION_CITIES.slice(0, 3).map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setDestinationPlace(city)}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        {city.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Carrier Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsCarrierName" />
                  </label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="e.g. Baytur Logistics / Driver Name"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsCarrierPhone" />
                  </label>
                  <input
                    type="text"
                    value={carrierPhone}
                    onChange={(e) => setCarrierPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Schedule & Status */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>Dates & Lifecycle Status</span>
              </h3>

              {/* Status Picker Stepper */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Trip Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {CONSOLIDATION_STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        status === st
                          ? 'bg-brand-gold text-brand-navy shadow-xs font-black'
                          : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
                      }`}
                    >
                      {status === st && <Check className="size-3.5" />}
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsDepartureDate" />
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsEstimatedArrival" />
                  </label>
                  <input
                    type="date"
                    value={estimatedArrivalDate}
                    onChange={(e) => setEstimatedArrivalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsArrivedDate" />
                  </label>
                  <input
                    type="date"
                    value={arrivedDate}
                    onChange={(e) => setArrivedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Carrier Freight Financials */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                <DollarSign className="size-3.5" />
                <span>Carrier Freight Financials</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsCarrierCost" />
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={totalCarrierCost}
                    onChange={(e) => setTotalCarrierCost(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    <T k="cnsCostCurrency" />
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {CURRENCIES.map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCarrierCostCurrency(curr)}
                        className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          carrierCostCurrency === curr
                            ? 'bg-brand-gold text-brand-navy font-black'
                            : 'bg-muted/60 text-muted-foreground hover:text-foreground border border-border'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Initial Cargos Picker (on Create) */}
            {!isEditing && availableCargos.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                    <Layers className="size-3.5" />
                    <span>Attach Initial Available LTL Cargos</span>
                  </h3>
                  <span className="text-xs font-bold text-muted-foreground">
                    {selectedCargoIds.length} selected
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-border p-2 bg-muted/20">
                  {availableCargos.map((c) => {
                    const isChecked = selectedCargoIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-brand-gold/15 border border-brand-gold/40'
                            : 'hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCargoCheckboxToggle(c.id)}
                            className="rounded border-border text-brand-gold focus:ring-brand-gold/50"
                          />
                          <span className="font-bold text-foreground truncate">{c.cargo}</span>
                          <span className="text-muted-foreground text-[11px] truncate">
                            ({c.client_name} • {c.volume} m³ • {c.weight} kg)
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          ${c.sell_price}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 6: Cascade Sync Options (on Edit) */}
            {isEditing && (
              <div className="p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 space-y-2">
                <h4 className="text-xs font-bold text-brand-gold flex items-center gap-1.5">
                  <Sparkles className="size-3.5" />
                  <span>Cascade Sync to Attached Client Cargos</span>
                </h4>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncStatusToCargos}
                      onChange={(e) => setSyncStatusToCargos(e.target.checked)}
                      className="rounded border-border text-brand-gold focus:ring-brand-gold/50"
                    />
                    <span>
                      <T k="cnsSyncStatusToCargos" />
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncDatesToCargos}
                      onChange={(e) => setSyncDatesToCargos(e.target.checked)}
                      className="rounded border-border text-brand-gold focus:ring-brand-gold/50"
                    />
                    <span>
                      <T k="cnsSyncDatesToCargos" />
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Description / Notes */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-foreground">
                Trip Notes & Documentation
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional customs clearance notes, border checkpoints, or cargo remarks..."
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold/50 resize-none"
              />
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-gold/90 hover:to-amber-500/90 text-brand-navy font-bold text-xs shadow-md shadow-brand-gold/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="size-4" />
                    <span>{isEditing ? 'Save Changes' : 'Create Consolidation'}</span>
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
