import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X, Truck, Loader2 } from 'lucide-react';
import { agentsApi } from '../../services/agents.service';
import type { AgentDropdownItem } from '../../types/agents';
import { useTranslation } from '../../context/LanguageContext';

export interface AgentSelectProps {
  value?: string | null; // Selected Agent UUID
  onChange: (agentId: string, agentName: string, agent?: AgentDropdownItem) => void;
  onClear?: () => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

function getAgentDisplayName(agent: AgentDropdownItem | null | undefined): string {
  if (!agent) return '';
  if (agent.display_name && agent.display_name.trim()) return agent.display_name.trim();
  if (agent.name && agent.name.trim()) return agent.name.trim();
  const fullName = [agent.first_name, agent.last_name]
    .filter((p) => p && typeof p === 'string' && p.trim().length > 0)
    .map((p) => p!.trim())
    .join(' ');
  if (fullName && agent.company_name && agent.company_name.trim()) {
    return `${fullName} (${agent.company_name.trim()})`;
  }
  if (fullName) return fullName;
  if (agent.company_name && agent.company_name.trim()) return agent.company_name.trim();
  return 'Agent';
}

export function AgentSelect({
  value,
  onChange,
  onClear,
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
}: AgentSelectProps) {
  const { t } = useTranslation();
  const displayLabel = label || t('colCarrier') || 'Carrier / Shipping Agent';
  const displayPlaceholder =
    placeholder || t('agentSelectPlaceholder') || 'Select shipping agent / carrier...';

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [agents, setAgents] = useState<AgentDropdownItem[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentDropdownItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    placement: 'bottom' | 'top';
  }>({
    top: 0,
    left: 0,
    width: 280,
    placement: 'bottom',
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < 260 && rect.top > 260;

    setCoords({
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: Math.max(rect.width, 260),
      placement: showAbove ? 'top' : 'bottom',
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Fetch agents using lightweight dropdown endpoint
  const fetchAgents = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const items = await agentsApi.getDropdown(query.trim() || undefined);
        const normalized: AgentDropdownItem[] = (items || []).map((item) => ({
          ...item,
          display_name: getAgentDisplayName(item),
        }));
        setAgents(normalized);

        if (value && !selectedAgent) {
          const found = normalized.find((a) => a.id === value);
          if (found) {
            setSelectedAgent(found);
          }
        }
      } catch (err) {
        console.error('Failed to fetch agents for dropdown:', err);
      } finally {
        setLoading(false);
      }
    },
    [value, selectedAgent]
  );

  // Sync selected agent with external value prop
  useEffect(() => {
    if (!value) {
      setSelectedAgent(null);
      return;
    }
    if (selectedAgent && selectedAgent.id === value) {
      return;
    }

    const found = agents.find((a) => a.id === value);
    if (found) {
      setSelectedAgent({
        ...found,
        display_name: getAgentDisplayName(found),
      });
    } else {
      agentsApi
        .getById(value)
        .then((fullAgent) => {
          if (fullAgent) {
            const name =
              fullAgent.display_name ||
              `${fullAgent.first_name || ''} ${fullAgent.last_name || ''}`.trim() ||
              fullAgent.company_name ||
              'Agent';
            setSelectedAgent({
              id: fullAgent.id,
              display_name: name,
              name,
              first_name: fullAgent.first_name,
              last_name: fullAgent.last_name,
              company_name: fullAgent.company_name,
              phone_number: fullAgent.phone_number,
            });
          }
        })
        .catch(() => {
          // Non-critical if lookup fails
        });
    }
  }, [value, agents, selectedAgent]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(
      () => {
        fetchAgents(searchQuery);
      },
      searchQuery ? 200 : 0
    );
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchAgents]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (agent: AgentDropdownItem) => {
    const name = getAgentDisplayName(agent);
    const normalizedAgent: AgentDropdownItem = {
      ...agent,
      display_name: name,
    };
    setSelectedAgent(normalizedAgent);
    setIsOpen(false);
    setSearchQuery('');
    onChange(agent.id, name, normalizedAgent);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAgent(null);
    setSearchQuery('');
    if (onClear) {
      onClear();
    } else {
      onChange('', '', undefined);
    }
  };

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
          <Truck className="size-3.5 text-brand-gold shrink-0" />
          <span>{displayLabel}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        ref={triggerRef}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-field text-field-foreground text-xs font-semibold cursor-pointer transition-all duration-200 select-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-default-100 dark:bg-default-50/20 border-field-border'
            : isOpen
              ? 'border-brand-royal ring-2 ring-brand-royal/20 shadow-xs'
              : 'border-field-border hover:border-border'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Truck className="size-4 text-brand-gold shrink-0" />
          {selectedAgent ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-foreground truncate">
                {getAgentDisplayName(selectedAgent)}
              </span>
              {selectedAgent.company_name &&
                selectedAgent.company_name !== getAgentDisplayName(selectedAgent) && (
                  <span className="text-[11px] text-muted truncate">
                    ({selectedAgent.company_name})
                  </span>
                )}
            </div>
          ) : (
            <span className="text-muted truncate font-normal">{displayPlaceholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedAgent && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-muted hover:text-foreground hover:bg-default-100 dark:hover:bg-default-50/20 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="size-3.5" />
            </button>
          )}
          <ChevronDown
            className={`size-4 text-muted transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-brand-royal' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.placement === 'top' ? undefined : `${coords.top}px`,
              bottom:
                coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="rounded-2xl border border-border/40 bg-surface text-foreground shadow-2xl overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150 backdrop-blur-md"
          >
            {/* Search Input Box */}
            <div className="p-2 border-b border-border/20 bg-default-50/30">
              <div className="relative flex items-center">
                <Search className="size-3.5 text-muted absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    t('agentSelectSearch') || 'Search agents by name, company, or phone...'
                  }
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-default-100/70 dark:bg-default-50/20 text-foreground border-none outline-none focus:ring-1 focus:ring-brand-royal"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 p-0.5 rounded text-muted hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>

            {/* List of Agents */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-border/10">
              {loading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted">
                  <Loader2 className="size-4 animate-spin text-brand-gold" />
                  <span>Loading agents...</span>
                </div>
              ) : agents.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                  <p className="font-semibold text-foreground/80">
                    {searchQuery ? 'No matching agents found' : 'No agents available'}
                  </p>
                  <p className="text-[11px] mt-1 text-muted">
                    {searchQuery
                      ? 'Try a different search query'
                      : 'Create an agent in the Agents directory'}
                  </p>
                </div>
              ) : (
                agents.map((agent) => {
                  const isSelected = selectedAgent?.id === agent.id;
                  const agentName = getAgentDisplayName(agent);
                  const showCompanySubtext = Boolean(
                    agent.company_name && agent.company_name !== agentName
                  );

                  return (
                    <div
                      key={agent.id}
                      onClick={() => handleSelect(agent)}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-brand-royal/15 text-brand-royal font-bold dark:text-brand-gold'
                          : 'hover:bg-default-100 dark:hover:bg-default-50/20 text-foreground'
                      }`}
                    >
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-xs truncate">
                            {agentName}
                          </span>
                          {isSelected && (
                            <Check className="size-3.5 text-brand-royal dark:text-brand-gold shrink-0" />
                          )}
                        </div>
                        {(showCompanySubtext || agent.phone_number) && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted">
                            {showCompanySubtext && (
                              <span className="truncate max-w-[180px]">{agent.company_name}</span>
                            )}
                            {showCompanySubtext && agent.phone_number && <span>•</span>}
                            {agent.phone_number && (
                              <span className="font-mono">{agent.phone_number}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
