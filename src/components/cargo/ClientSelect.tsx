import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, Check, X, Building2, Loader2 } from 'lucide-react';
import { clientsApi } from '../../services/clients.service';
import type { Client } from '../../services/clients.service';
import { useTranslation } from '../../context/LanguageContext';

export interface ClientSelectProps {
  value?: string | null; // Selected Client UUID
  onChange: (clientId: string, clientName: string, client?: Client) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ClientSelect({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
}: ClientSelectProps) {
  const { t } = useTranslation();
  const displayLabel = label || t('lblClientSelect');
  const displayPlaceholder = placeholder || t('lblClientSelectPlaceholder');

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch clients from backend GET /clients with backend search capability
  const fetchClients = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await clientsApi.list({
        search: query.trim() || undefined,
        limit: 20,
      });
      const items = res?.data || (Array.isArray(res) ? res : []);
      setClients(items);

      // Resolve selected client if we have UUID but not the client object
      if (value && !selectedClient) {
        const found = items.find((c) => c.id === value);
        if (found) {
          setSelectedClient(found);
        }
      }
    } catch (err) {
      console.error('Failed to fetch clients for selector:', err);
    } finally {
      setLoading(false);
    }
  }, [value, selectedClient]);

  // Sync selectedClient with value prop
  useEffect(() => {
    if (!value) {
      setSelectedClient(null);
      return;
    }
    if (selectedClient && selectedClient.id === value) {
      return;
    }

    const found = clients.find((c) => c.id === value);
    if (found) {
      setSelectedClient(found);
    } else {
      clientsApi
        .get(value)
        .then((c) => {
          if (c) setSelectedClient(c);
        })
        .catch(() => {
          // Ignore
        });
    }
  }, [value, clients, selectedClient]);

  // Fetch clients when searchQuery changes or dropdown opens
  const lastFetchedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Don't refetch if query hasn't changed and we already have results for empty query
    if (lastFetchedQueryRef.current === searchQuery && clients.length > 0) {
      return;
    }

    const timer = setTimeout(() => {
      fetchClients(searchQuery);
      lastFetchedQueryRef.current = searchQuery;
    }, searchQuery ? 250 : 0);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchClients, clients.length]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (c: Client) => {
    const fullName = `${c.first_name} ${c.last_name}`.trim();
    setSelectedClient(c);
    onChange(c.id, fullName, c);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClient(null);
    onChange('', '');
  };

  const getClientFullName = (c: Client) => {
    return `${c.first_name} ${c.last_name}`.trim() || 'Unnamed Client';
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {displayLabel && (
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {displayLabel} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-foreground text-sm font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed bg-muted/30' : 'hover:border-brand-gold/60'
        } ${isOpen ? 'border-brand-gold ring-2 ring-brand-gold/20' : 'border-border'}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {selectedClient ? (
            <>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                <Building2 className="size-3.5" />
              </div>
              <div className="truncate text-left">
                <span className="text-foreground font-bold text-xs block truncate">
                  {getClientFullName(selectedClient)}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {selectedClient.company_name || selectedClient.phone || 'Client'}
                </span>
              </div>
            </>
          ) : (
            <span className="text-muted-foreground text-xs font-medium truncate">{displayPlaceholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
          {selectedClient && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-foreground rounded-full hover:bg-muted/80 transition-colors"
              title="Clear selection"
            >
              <X className="size-3.5" />
            </button>
          )}
          <ChevronDown className={`size-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-gold' : ''}`} />
        </div>
      </div>

      {/* Hidden input to support HTML form required validation */}
      {required && (
        <input
          type="text"
          readOnly
          required
          value={value || ''}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Menu overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-border bg-surface dark:bg-surface shadow-xl z-50 overflow-hidden max-h-60 flex flex-col">
          {/* Search Box */}
          <div className="p-2 border-b border-border bg-muted/20 sticky top-0 shrink-0">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={displayPlaceholder}
                className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-gold/50"
              />
              <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 hover:text-foreground text-muted-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto flex-1 py-1">
            {loading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-muted-foreground text-xs font-medium">
                <Loader2 className="size-4 animate-spin text-brand-gold" />
                <span>Loading clients...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-xs font-medium">
                No clients found
              </div>
            ) : (
              clients.map((c) => {
                const isSelected = selectedClient?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`px-3.5 py-2 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected ? 'bg-brand-gold/10 font-bold' : ''
                    }`}
                  >
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-foreground text-xs font-bold truncate">
                        {getClientFullName(c)}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {c.company_name} &bull; {c.phone}
                      </span>
                    </div>
                    {isSelected && <Check className="size-4 text-brand-gold shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
