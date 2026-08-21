import { useState, useEffect, useRef } from 'react';
import { Truck, ChevronDown, Search, Plus, X, RefreshCw } from 'lucide-react';
import { cargoConsolidationsApi } from '../../services/cargoConsolidations.service';
import type { ConsolidationActiveDropdownItem } from '../../services/cargoConsolidations.service';

export interface ConsolidationSelectProps {
  value?: string | null;
  onChange: (
    consolidationId: string | null,
    selectedItem?: ConsolidationActiveDropdownItem | null
  ) => void;
  onRequestCreateNew?: () => void;
  requiredVolume?: number;
  className?: string;
  disabled?: boolean;
}

export function ConsolidationSelect({
  value,
  onChange,
  onRequestCreateNew,
  requiredVolume,
  className = '',
  disabled = false,
}: ConsolidationSelectProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [items, setItems] = useState<ConsolidationActiveDropdownItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadActiveTrucks();
  }, []);

  const loadActiveTrucks = async () => {
    setLoading(true);
    try {
      const activeList = await cargoConsolidationsApi.getActive();
      setItems(activeList);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = items.find((i) => i.id === value);

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      item.container_truck_id.toLowerCase().includes(s) ||
      item.consolidation_code.toLowerCase().includes(s) ||
      (item.carrier_name || '').toLowerCase().includes(s) ||
      (item.origin_place || '').toLowerCase().includes(s) ||
      (item.destination_place || '').toLowerCase().includes(s)
    );
  });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selector Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
          disabled ? 'opacity-60 pointer-events-none bg-muted/40' : 'bg-surface hover:border-border'
        } ${isOpen ? 'border-brand-gold ring-2 ring-brand-gold/30' : 'border-border'}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Truck className="size-4 text-brand-gold shrink-0" />
          {selectedItem ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-mono text-xs font-bold text-foreground truncate">
                {selectedItem.container_truck_id}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-gold/15 text-brand-navy dark:text-brand-gold font-bold shrink-0">
                {selectedItem.consolidation_code}
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                ({selectedItem.remaining_volume} m³ free)
              </span>
              {selectedItem.origin_place && selectedItem.destination_place && (
                <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                  • {selectedItem.origin_place} → {selectedItem.destination_place}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              Select Consolidation Truck / Trip...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedItem && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null, null);
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform ${
              isOpen ? 'rotate-180 text-brand-gold' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-72">
          {/* Search Input Bar */}
          <div className="p-2 border-b border-border/80 bg-muted/20 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Search active trucks by plate, code, route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold/60"
              />
            </div>
          </div>

          {/* List Options */}
          <div className="overflow-y-auto flex-1 p-1.5 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw className="size-3.5 animate-spin text-brand-gold" />
                <span>Loading active vehicles...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No active consolidation trucks found
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === value;
                const hasEnoughSpace =
                  requiredVolume === undefined ||
                  requiredVolume <= 0 ||
                  item.remaining_volume >= requiredVolume;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onChange(item.id, item);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-brand-gold/15 dark:bg-brand-gold/10 font-bold text-foreground border border-brand-gold/40'
                        : 'hover:bg-muted/40 text-foreground border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-foreground">
                          {item.container_truck_id}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                          {item.consolidation_code}
                        </span>
                        {item.container_type && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted-foreground">
                            {item.container_type}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                          {item.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                        {item.origin_place && item.destination_place && (
                          <span>
                            {item.origin_place} → {item.destination_place}
                          </span>
                        )}
                        {item.carrier_name && <span>• {item.carrier_name}</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span
                        className={`font-mono text-xs font-bold block ${
                          !hasEnoughSpace
                            ? 'text-amber-500'
                            : item.remaining_volume > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500'
                        }`}
                      >
                        {item.remaining_volume} m³ free
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({item.assigned_volume}/{item.max_volume_capacity} m³)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action: + Register New Truck / Trip */}
          {onRequestCreateNew && (
            <div className="p-2 border-t border-border/80 bg-muted/30 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onRequestCreateNew();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-brand-navy/10 dark:bg-brand-gold/10 hover:bg-brand-navy/20 dark:hover:bg-brand-gold/20 text-brand-navy dark:text-brand-gold text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>+ Register New Truck / Trip</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
