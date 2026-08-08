import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, Check, X, User, Loader2 } from 'lucide-react';
import { employeesApi } from '../../services/employees.service';
import type { Employee } from '../../services/employees.service';

export interface EmployeeSelectProps {
  value?: string | null; // Selected Employee UUID
  onChange: (employeeId: string, employeeName: string, employee?: Employee) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function EmployeeSelect({
  value,
  onChange,
  label = 'Select Employee',
  placeholder = 'Search employee by name or phone...',
  required = false,
  disabled = false,
  className = '',
}: EmployeeSelectProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch employees from backend GET /employees with backend search capability
  const fetchEmployees = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const res = await employeesApi.list({
          search: query.trim() || undefined,
          limit: 20,
        });
        const items = res?.items || (Array.isArray(res) ? res : []);
        setEmployees(items);

        // If we have a selected value but no selectedEmployee object yet, resolve it from fetched list or API
        if (value && !selectedEmployee) {
          const found = items.find((e) => e.id === value);
          if (found) {
            setSelectedEmployee(found);
          }
        }
      } catch (err) {
        console.error('Failed to fetch employees for selector:', err);
      } finally {
        setLoading(false);
      }
    },
    [value, selectedEmployee]
  );

  // If value is provided and selectedEmployee is not set or out-of-sync, fetch single employee
  useEffect(() => {
    if (!value) {
      setSelectedEmployee(null);
      return;
    }
    if (selectedEmployee && selectedEmployee.id === value) {
      return;
    }

    // Try to find in current list
    const found = employees.find((e) => e.id === value);
    if (found) {
      setSelectedEmployee(found);
    } else {
      // Fetch single employee by UUID
      employeesApi
        .get(value)
        .then((emp) => {
          if (emp) setSelectedEmployee(emp);
        })
        .catch(() => {
          // Fallback if get fails
        });
    }
  }, [value, employees, selectedEmployee]);

  // Fetch employees when searchQuery changes or dropdown opens
  const lastFetchedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Don't refetch if query hasn't changed and we already have results for empty query
    if (lastFetchedQueryRef.current === searchQuery && employees.length > 0) {
      return;
    }

    const timer = setTimeout(
      () => {
        fetchEmployees(searchQuery);
        lastFetchedQueryRef.current = searchQuery;
      },
      searchQuery ? 250 : 0
    );

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchEmployees, employees.length]);

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

  const handleSelect = (emp: Employee) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.trim();
    setSelectedEmployee(emp);
    onChange(emp.id, fullName, emp);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmployee(null);
    onChange('', '');
  };

  const getEmployeeFullName = (emp: Employee) => {
    return `${emp.first_name} ${emp.last_name}`.trim() || 'Unnamed Employee';
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
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
          {selectedEmployee ? (
            <>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: selectedEmployee.color || '#C8A96A' }}
              >
                {selectedEmployee.picture_url ? (
                  <img
                    src={selectedEmployee.picture_url}
                    alt={getEmployeeFullName(selectedEmployee)}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  `${selectedEmployee.first_name?.[0] || ''}${selectedEmployee.last_name?.[0] || ''}`.toUpperCase() ||
                  'E'
                )}
              </div>
              <div className="truncate text-left">
                <span className="text-foreground font-bold text-xs block truncate">
                  {getEmployeeFullName(selectedEmployee)}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {selectedEmployee.department_display_name ||
                    selectedEmployee.department_name ||
                    selectedEmployee.phone ||
                    'Employee'}
                </span>
              </div>
            </>
          ) : (
            <span className="text-muted-foreground text-xs font-medium truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
          {selectedEmployee && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-foreground rounded-full hover:bg-muted/80 transition-colors"
              title="Clear selection"
            >
              <X className="size-3.5" />
            </button>
          )}
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-gold' : ''}`}
          />
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

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-surface dark:bg-surface border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, dept..."
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
              />
              {loading && (
                <Loader2 className="size-3.5 text-brand-gold animate-spin absolute right-3 top-3" />
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {loading && employees.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-brand-gold" />
                <span>Searching employees backend...</span>
              </div>
            ) : employees.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                <User className="size-6 mx-auto mb-1 opacity-40" />
                No employees found matching "{searchQuery}"
              </div>
            ) : (
              employees.map((emp) => {
                const isSelected = value === emp.id;
                const empNameStr = getEmployeeFullName(emp);

                return (
                  <button
                    type="button"
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-brand-gold/15 text-brand-gold font-bold'
                        : 'hover:bg-muted/60 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: emp.color || '#C8A96A' }}
                      >
                        {emp.picture_url ? (
                          <img
                            src={emp.picture_url}
                            alt={empNameStr}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}`.toUpperCase() ||
                          'E'
                        )}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold block truncate text-foreground">
                          {empNameStr}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {emp.department_display_name || emp.department_name || 'Sales'} •{' '}
                          {emp.phone}
                        </span>
                      </div>
                    </div>

                    {isSelected && <Check className="size-4 text-brand-gold shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
