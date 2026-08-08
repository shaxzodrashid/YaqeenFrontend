import { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from '@heroui/react';
import { User, Building, MapPin } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import type { Client, Employee, CreateClientDto, ApiError } from '../services/api';
import { PhoneInput } from './PhoneInput';

export interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  client: Client | null;
  employees: Employee[];
  onSuccess: () => void;
}

export function ClientFormModal({
  isOpen,
  onClose,
  mode,
  client,
  employees,
  onSuccess,
}: ClientFormModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && client) {
        setFirstName(client.first_name || '');
        setLastName(client.last_name || '');
        setPhone(client.phone || '+998');
        setCompanyName(client.company_name || '');
        setAddress(client.address || '');
        setAssignedEmployeeId(client.assigned_employee_id || '');
        setIsActive(client.is_active ?? true);
      } else {
        setFirstName('');
        setLastName('');
        setPhone('+998');
        setCompanyName('');
        setAddress('');
        setAssignedEmployeeId('');
        setIsActive(true);
      }
      setErrors({});
    }
  }, [isOpen, mode, client]);

  const selectedEmployee = employees.find((emp) => emp.id === assignedEmployeeId);
  const inheritedColor = selectedEmployee?.color || '#808080';

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) {
      newErrors.first_name = t('fieldRequired') || 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.last_name = t('fieldRequired') || 'Last name is required';
    }
    if (!companyName.trim()) {
      newErrors.company_name = t('fieldRequired') || 'Company name is required';
    }
    if (!phone || phone.trim().length < 9) {
      newErrors.phone = t('fieldRequired') || 'Valid phone number is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const dto: CreateClientDto = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        company_name: companyName.trim(),
        address: address.trim() || undefined,
        assigned_employee_id: assignedEmployeeId || undefined,
        is_active: isActive,
      };

      if (mode === 'create') {
        await api.clients.create(dto);
        showNotification(t('successClientCreated') || 'Client successfully created!', 'success');
      } else if (mode === 'edit' && client) {
        await api.clients.update(client.id, dto);
        showNotification(t('successClientUpdated') || 'Client successfully updated!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      const error = err as ApiError;
      if (error?.location === 'client_phone_exists') {
        setErrors((prev) => ({
          ...prev,
          phone: t('client_phone_exists') || 'A client with this phone number already exists.',
        }));
      } else {
        showNotification(
          t(error?.location || 'internal_error') || error?.message || 'Failed to save client',
          'error'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
          <Modal.Dialog className="max-w-xl">
            <Modal.CloseTrigger className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none" />
            <Modal.Header>
              <Modal.Heading className="font-serif font-bold text-lg">
                {mode === 'create'
                  ? t('clientModalCreateTitle') || 'Create New Client'
                  : t('clientModalEditTitle') || 'Edit Client Information'}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4 py-4 max-h-[75vh] overflow-y-auto">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <User className="size-3.5 text-muted" />
                    {t('colName') || 'First Name'} *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setErrors((p) => ({ ...p, first_name: '' }));
                    }}
                    placeholder="Jasur"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 ${
                      errors.first_name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border'
                    }`}
                  />
                  {errors.first_name && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.first_name}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <User className="size-3.5 text-muted" />
                    {t('lastName') || 'Last Name'} *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setErrors((p) => ({ ...p, last_name: '' }));
                    }}
                    placeholder="Yo'ldoshev"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 ${
                      errors.last_name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border'
                    }`}
                  />
                  {errors.last_name && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Company Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Building className="size-3.5 text-muted" />
                    {t('companyName') || 'Company Name'} *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setErrors((p) => ({ ...p, company_name: '' }));
                    }}
                    placeholder="Global Cargo LLC"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 ${
                      errors.company_name ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border'
                    }`}
                  />
                  {errors.company_name && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.company_name}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <PhoneInput
                    value={phone}
                    onChange={(val) => {
                      setPhone(val);
                      setErrors((p) => ({ ...p, phone: '' }));
                    }}
                    error={errors.phone}
                    label={t('colPhone') || 'Phone Number'}
                    isRequired
                  />
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted" />
                  {t('address') || 'Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Tashkent city, Yunusabad district..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border border-field-border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30"
                />
              </div>

              {/* Assigned Employee Dropdown & Color Tag Preview */}
              <div className="flex flex-col gap-2 text-left">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-muted" />
                  {t('assignedEmployee') || 'Responsible Employee'}
                </label>
                <select
                  value={assignedEmployeeId}
                  onChange={(e) => setAssignedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-field text-field-foreground border border-field-border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 cursor-pointer"
                >
                  <option value="">{t('noneUnassigned') || 'Unassigned (No Employee)'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.phone}) - #{emp.color || '808080'}
                    </option>
                  ))}
                </select>

                {/* Inherited Color Tag Badge Box */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-default-100/50 dark:bg-default-50/10 border border-border/30">
                  <div
                    className="size-4 rounded-full shadow-sm shrink-0 border border-white/20"
                    style={{ backgroundColor: inheritedColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>Inherited Color Tag:</span>
                      <code className="font-mono text-brand-gold">{inheritedColor.toUpperCase()}</code>
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {selectedEmployee
                        ? `Client inherits color from ${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                        : 'Unassigned clients default to Unassigned Gray (#808080)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active status toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-default/40 border border-border/20 mt-1">
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {t('colStatus') || 'Client Status'}
                  </div>
                  <div className="text-[11px] text-muted">
                    {isActive ? t('statusActive') || 'Active client record' : t('statusInactive') || 'Inactive / Archived'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-focus/30 ${
                    isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </Modal.Body>

            <Modal.Footer className="flex justify-end gap-3 pt-3">
              <Button variant="ghost" onPress={onClose} className="font-semibold">
                {t('actionCancel') || 'Cancel'}
              </Button>
              <Button
                onPress={handleSubmit}
                isDisabled={saving}
                className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {mode === 'create' ? t('actionCreating') || 'Creating...' : t('actionSaving') || 'Saving...'}
                  </>
                ) : mode === 'create' ? (
                  t('actionCreate') || 'Create Client'
                ) : (
                  t('actionSave') || 'Save Changes'
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
  );
}
