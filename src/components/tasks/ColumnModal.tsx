import { useState, useEffect } from 'react';
import { Modal, Button } from '@heroui/react';
import { Plus, Edit2, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import type { KanbanColumn } from '../../services/api';

interface ColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    allowed_roles?: string[] | null;
    color?: string | null;
    is_done_status?: boolean;
  }) => Promise<void>;
  column?: KanbanColumn | null;
  availableRoles?: string[];
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald/Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#64748B', // Slate
];

const DEFAULT_SYSTEM_ROLES = ['CEO', 'ROP', 'EMPLOYEE'];

import {
  getColumnColor,
  saveStoredColumnColor,
  getDefaultColorByName,
} from '../../utils/columnColor';

export function ColumnModal({
  isOpen,
  onClose,
  onSave,
  column,
  availableRoles = DEFAULT_SYSTEM_ROLES,
}: ColumnModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [isDoneStatus, setIsDoneStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (column) {
      setName(column.name || '');
      setColor(getColumnColor(column));
      setAllowedRoles(column.allowed_roles || column.allowedRoles || []);
      setIsDoneStatus(!!(column.is_done_status || column.isDoneStatus));
    } else {
      setName('');
      setColor('#3B82F6');
      setAllowedRoles([]);
      setIsDoneStatus(false);
    }
  }, [column, isOpen]);

  const toggleRole = (role: string) => {
    if (allowedRoles.includes(role)) {
      setAllowedRoles(allowedRoles.filter((r) => r !== role));
    } else {
      setAllowedRoles([...allowedRoles, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const targetColor = color.trim() || getDefaultColorByName(name.trim());
      if (column?.id) {
        saveStoredColumnColor(column.id, targetColor);
      }
      await onSave({
        name: name.trim(),
        color: targetColor,
        allowed_roles: allowedRoles.length > 0 ? allowedRoles : null,
        is_done_status: isDoneStatus,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="max-w-lg w-full bg-surface dark:bg-night-sidebar border border-border/60 shadow-2xl rounded-2xl overflow-hidden p-0">
          <Modal.CloseTrigger className="absolute top-4 right-4 p-2 rounded-xl text-muted hover:text-foreground hover:bg-border/30 transition-colors cursor-pointer" />

          <form onSubmit={handleSubmit}>
            <Modal.Header className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
              <div
                className="size-10 rounded-xl flex items-center justify-center border text-white font-bold"
                style={{ backgroundColor: color, borderColor: `${color}88` }}
              >
                {column ? <Edit2 className="size-5" /> : <Plus className="size-5" />}
              </div>
              <div>
                <Modal.Heading className="text-base font-bold text-foreground">
                  {column ? t('taskEditColumn') : t('taskNewColumn')}
                </Modal.Heading>
                <p className="text-xs text-muted">
                  Configure status name, color badge, and transition permissions
                </p>
              </div>
            </Modal.Header>

            <Modal.Body className="px-6 py-5 flex flex-col gap-5">
              {/* Column Name */}
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                  Column Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. To Do, In Review, Released"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-surface text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                />
              </div>

              {/* Color Accent Picker */}
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
                  Column Color Accent
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`size-8 rounded-full border-2 transition-all cursor-pointer ${
                        color === c
                          ? 'border-foreground scale-110 shadow-md'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2 bg-border/20 px-3 py-1 rounded-xl border border-border">
                    <span className="text-xs font-mono text-muted">Custom:</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="size-6 rounded border-none bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-foreground font-bold">{color}</span>
                  </div>
                </div>
              </div>

              {/* Allowed Roles Restriction */}
              <div className="p-4 rounded-xl border border-border bg-border/10">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="size-4 text-brand-gold" />
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Restricted Transition Roles (`allowed_roles`)
                  </label>
                </div>
                <p className="text-xs text-muted mb-3 leading-relaxed">
                  If specified, only users with these roles (and CEO superusers) can create or move
                  tasks into this column. Leave empty to allow all roles.
                </p>

                <div className="flex flex-wrap gap-2">
                  {availableRoles.map((role) => {
                    const isChecked = allowedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isChecked
                            ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/60 shadow-sm'
                            : 'bg-surface text-muted border-border hover:border-foreground/40'
                        }`}
                      >
                        {isChecked ? `✓ ${role}` : `+ ${role}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Is Completed Status Flag */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Mark Tasks in this Column as Completed (`is_done_status`)
                  </span>
                  <span className="text-[11px] text-muted block mt-0.5">
                    Tasks reaching this column automatically record completion timestamps and show
                    green checkmarks.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isDoneStatus}
                  onChange={(e) => setIsDoneStatus(e.target.checked)}
                  className="size-5 rounded border-border accent-emerald-500 cursor-pointer"
                />
              </label>
            </Modal.Body>

            <Modal.Footer className="border-t border-border/40 px-6 py-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                onClick={onClose}
                isDisabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-border/20 hover:bg-border/40 text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isDisabled={loading || !name.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-gold text-brand-navy hover:opacity-90 transition-opacity cursor-pointer"
              >
                {column ? 'Save Changes' : 'Create Column'}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
