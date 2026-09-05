import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@heroui/react';
import { User, Building2, Mail, FileText, Plus, X, Tag, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import type { Agent, CreateAgentDto, UpdateAgentDto } from '../../types/agents';
import { PhoneInput } from '../PhoneInput';

export interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  agent: Agent | null;
  onSuccess: () => void;
}

export function AgentFormModal({ isOpen, onClose, mode, agent, onSuccess }: AgentFormModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyNames, setCompanyNames] = useState<string[]>([]);
  const [newAliasInput, setNewAliasInput] = useState('');
  const [phone, setPhone] = useState('+998');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && agent) {
        setFirstName(agent.first_name || '');
        setLastName(agent.last_name || '');
        setCompanyName(agent.company_name || '');
        setCompanyNames(Array.isArray(agent.company_names) ? [...agent.company_names] : []);
        setPhone(agent.phone_number || '+998');
        setEmail(agent.email || '');
        setNotes(agent.notes || '');
        setIsActive(agent.is_active ?? true);
      } else {
        setFirstName('');
        setLastName('');
        setCompanyName('');
        setCompanyNames([]);
        setPhone('+998');
        setEmail('');
        setNotes('');
        setIsActive(true);
      }
      setNewAliasInput('');
      setErrors({});
    }
  }, [isOpen, mode, agent]);

  // Alias tags management
  const handleAddAlias = () => {
    const trimmed = newAliasInput.trim();
    if (!trimmed) return;
    if (companyNames.includes(trimmed)) {
      setNewAliasInput('');
      return;
    }
    setCompanyNames((prev) => [...prev, trimmed]);
    setNewAliasInput('');
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    setCompanyNames((prev) => prev.filter((a) => a !== aliasToRemove));
  };

  const handleAliasKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddAlias();
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // API rule: at least one of first_name, last_name, or company_name must be provided
    if (!firstName.trim() && !lastName.trim() && !companyName.trim()) {
      newErrors.general =
        t('agentValidationNameOrCompany') ||
        'Please provide at least a contact name (first/last) or a primary company name.';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = t('invalid_email') || 'Please enter a valid email address.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: CreateAgentDto = {
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        company_name: companyName.trim() || undefined,
        company_names: companyNames.length > 0 ? companyNames : undefined,
        phone_number: phone.trim().length > 4 ? phone.trim() : undefined,
        email: email.trim() ? email.trim().toLowerCase() : undefined,
        notes: notes.trim() || undefined,
      };

      if (mode === 'create') {
        await api.agents.create(payload);
        showNotification(
          t('agentCreatedSuccess') || 'Shipping agent created successfully!',
          'success'
        );
      } else if (mode === 'edit' && agent) {
        const updatePayload: UpdateAgentDto = {
          ...payload,
          is_active: isActive,
        };
        await api.agents.update(agent.id, updatePayload);
        showNotification(
          t('agentUpdatedSuccess') || 'Shipping agent updated successfully!',
          'success'
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.location === 'invalid_phone_number') {
        setErrors((prev) => ({
          ...prev,
          phone: t('invalid_phone_number') || 'Invalid phone number format.',
        }));
      } else if (err?.location === 'invalid_email') {
        setErrors((prev) => ({
          ...prev,
          email: t('invalid_email') || 'Invalid email address format.',
        }));
      } else if (err?.location === 'insufficient_permissions') {
        showNotification(
          t('insufficient_permissions') || 'You do not have permission to modify agents.',
          'error'
        );
      } else {
        showNotification(err?.message || 'Failed to save shipping agent', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="max-w-2xl bg-surface text-foreground border border-border/30 shadow-2xl rounded-2xl">
          <Modal.CloseTrigger className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-default-100 dark:hover:bg-default-50/20 cursor-pointer focus:outline-none transition-colors" />

          <Modal.Header className="border-b border-border/20 px-6 py-5">
            <Modal.Heading className="font-serif font-bold text-xl flex items-center gap-2.5 text-foreground">
              <Building2 className="size-5 text-brand-gold shrink-0" />
              <span>
                {mode === 'create'
                  ? t('agentModalCreateTitle') || 'Create Shipping Agent'
                  : t('agentModalEditTitle') || 'Edit Shipping Agent Profile'}
              </span>
            </Modal.Heading>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4 px-6 py-5 max-h-[75vh] overflow-y-auto">
            {/* General validation error banner */}
            {errors.general && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {errors.general}
              </div>
            )}

            {/* Contact Person: First Name & Last Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-brand-gold" />
                <span>Contact Representative</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setErrors((p) => ({ ...p, general: '' }));
                    }}
                    placeholder={t('agentFirstName') || 'First Name (e.g. Farrukh)'}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border border-field-border focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setErrors((p) => ({ ...p, general: '' }));
                    }}
                    placeholder={t('agentLastName') || 'Last Name (e.g. Karimov)'}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border border-field-border focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Primary Company Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Building2 className="size-3.5 text-brand-gold" />
                <span>{t('agentCompanyName') || 'Primary Company Name'}</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setErrors((p) => ({ ...p, general: '' }));
                }}
                placeholder={t('agentCompanyNamePlaceholder') || 'e.g. TransLogistics Group LLC'}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border border-field-border focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 transition-all outline-none"
              />
            </div>

            {/* Company Aliases (Array of alternate names) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Tag className="size-3.5 text-brand-gold" />
                  <span>{t('agentAliases') || 'Company Aliases / Subsidiary Names'}</span>
                </label>
                <span className="text-[11px] text-muted">
                  {companyNames.length} {companyNames.length === 1 ? 'alias' : 'aliases'}
                </span>
              </div>

              {/* Alias Tags List */}
              {companyNames.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-default-50/50 border border-border/20">
                  {companyNames.map((alias) => (
                    <span
                      key={alias}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-royal/10 text-brand-royal dark:text-brand-gold border border-brand-royal/20 dark:border-brand-gold/30"
                    >
                      <span>{alias}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlias(alias)}
                        className="p-0.5 rounded hover:bg-brand-royal/20 dark:hover:bg-brand-gold/20 text-muted hover:text-foreground cursor-pointer transition-colors"
                        title="Remove alias"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add Alias Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAliasInput}
                  onChange={(e) => setNewAliasInput(e.target.value)}
                  onKeyDown={handleAliasKeyDown}
                  placeholder={
                    t('agentAliasPlaceholder') ||
                    'Type alias and press Enter or click Add (e.g. TLG China Branch)'
                  }
                  className="flex-1 px-3 py-2 rounded-xl text-xs bg-field text-field-foreground border border-field-border focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 transition-all outline-none"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={handleAddAlias}
                  isDisabled={!newAliasInput.trim()}
                  className="px-3 py-2 font-semibold text-xs border border-border/40 hover:bg-default-100 text-foreground rounded-xl"
                >
                  <Plus className="size-3.5 mr-1" />
                  <span>{t('agentAddAlias') || 'Add'}</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted leading-tight">
                {t('agentAliasHelp') ||
                  'Aliases allow historical cargos with spelling variations or subsidiary names to automatically link to this agent.'}
              </p>
            </div>

            {/* Contact Details: Phone Number & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <PhoneInput
                  value={phone}
                  onChange={(val) => {
                    setPhone(val);
                    setErrors((p) => ({ ...p, phone: '' }));
                  }}
                  label={t('agentPhone') || 'Primary Phone Number'}
                  error={errors.phone}
                  size="md"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-brand-gold" />
                  <span>{t('agentEmail') || 'Contact Email'}</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: '' }));
                  }}
                  placeholder={t('agentEmailPlaceholder') || 'agent@logistics.com'}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border transition-all outline-none ${
                    errors.email
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-field-border focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20'
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-500 font-medium">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Notes & Route Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-brand-gold" />
                <span>{t('agentNotes') || 'Notes & Specialization'}</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  t('agentNotesPlaceholder') ||
                  'e.g. Primary agent for container consignments via Dostyk, Yiwu-Tashkent routes, prompt customs release...'
                }
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border border-field-border focus:border-brand-royal focus:ring-2 focus:ring-brand-royal/20 transition-all outline-none resize-none"
              />
            </div>

            {/* Active Status Toggle (Edit Mode) */}
            {mode === 'edit' && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-default-100/50 dark:bg-default-50/10 border border-border/20">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {t('agentColStatus') || 'Agent Status'}
                    </p>
                    <p className="text-[11px] text-muted">
                      {t('agentIsActive') || 'Agent is active and available for new dispatches'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-default-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer className="border-t border-border/20 px-6 py-4 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onPress={onClose}
              isDisabled={saving}
              className="font-semibold text-sm rounded-xl"
            >
              {t('actionCancel') || 'Cancel'}
            </Button>
            <Button
              onPress={handleSubmit}
              isDisabled={saving}
              className="bg-brand-royal text-white hover:bg-brand-royal/90 font-bold text-sm px-5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>{t('saving') || 'Saving...'}</span>
                </div>
              ) : mode === 'create' ? (
                t('btnCreateAccount') || 'Create Agent'
              ) : (
                t('saveChanges') || 'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
