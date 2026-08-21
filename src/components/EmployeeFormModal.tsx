import { useEffect, useState, useRef } from 'react';
import { Modal, Button, Spinner, Avatar } from '@heroui/react';
import {
  User,
  Phone,
  ShieldCheck,
  Camera,
  Trash2,
  Building,
  Coins,
  MapPin,
  Palette,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { api, getImageUrl } from '../services/api';
import type {
  Employee,
  Department,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ApiError,
  SupportedCurrency,
  Role,
} from '../services/api';
import { PhoneInput } from './PhoneInput';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  employee: Employee | null;
  departments: Department[];
  onSuccess: () => void;
}

const colorPresets = [
  '#CCCCCC', // Default grey
  '#0F2D5C', // Brand Royal
  '#C8A96A', // Brand Gold
  '#10B981', // Emerald
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

// Helper to determine if text on this color should be dark or light
function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 3 && c.length !== 6) return true;
  const r = parseInt(c.length === 3 ? c[0] + c[0] : c.substring(0, 2), 16);
  const g = parseInt(c.length === 3 ? c[1] + c[1] : c.substring(2, 4), 16);
  const b = parseInt(c.length === 3 ? c[2] + c[2] : c.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
}

export function EmployeeFormModal({
  isOpen,
  onClose,
  mode,
  employee,
  departments,
  onSuccess,
}: EmployeeFormModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailedEmployee, setDetailedEmployee] = useState<Employee | null>(null);
  const pictureInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [address, setAddress] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [fixedSalary, setFixedSalary] = useState('');
  const [color, setColor] = useState('#CCCCCC');
  const [isActive, setIsActive] = useState(true);
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string>('');
  const [currency, setCurrency] = useState<SupportedCurrency>('UZS');

  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [deletingPicture, setDeletingPicture] = useState(false);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const rolesList = await api.roles.list();
        setAvailableRoles(rolesList || []);

        // Default role in create mode if roles loaded
        if (mode === 'create' && !role && rolesList && rolesList.length > 0) {
          const defaultRole = rolesList.find((r) => r.name === 'EMPLOYEE') || rolesList[0];
          if (defaultRole) {
            setRole(defaultRole.name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      } finally {
        setLoadingRoles(false);
      }
    };

    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen, mode, role]);

  useEffect(() => {
    if (!isOpen) {
      setDetailedEmployee(null);
      setLoadingDetails(false);
      return;
    }

    if (mode === 'edit' && employee?.id) {
      const initialFirstName = employee.first_name || employee.full_name?.split(' ')[0] || '';
      const initialLastName =
        employee.last_name || employee.full_name?.split(' ').slice(1).join(' ') || '';
      const initialPhone = employee.phone || '+998';
      const formattedInitialPhone = initialPhone.startsWith('+')
        ? initialPhone
        : `+${initialPhone.replace(/^\+/, '')}`;

      setFirstName(initialFirstName);
      setLastName(initialLastName);
      setPhone(formattedInitialPhone);
      setSecondaryPhone(
        employee.secondary_phone
          ? employee.secondary_phone.startsWith('+')
            ? employee.secondary_phone
            : `+${employee.secondary_phone.replace(/^\+/, '')}`
          : ''
      );
      setAddress(employee.address || '');
      setDepartmentId(employee.department_id || '');
      setFixedSalary(
        employee.fixed_salary !== undefined &&
          employee.fixed_salary !== null &&
          employee.fixed_salary !== '' &&
          !isNaN(Number(employee.fixed_salary))
          ? parseFloat(String(employee.fixed_salary)).toString()
          : ''
      );
      setCurrency((employee.currency || 'UZS') as SupportedCurrency);
      setColor(employee.color || '#CCCCCC');
      setIsActive(employee.is_active ?? true);
      setPictureUrl(employee.picture_url || null);
      setRole(employee.user_role || employee.user?.role || employee.role_name || '');
      setErrors({});

      let isMounted = true;
      const fetchDetails = async () => {
        setLoadingDetails(true);
        try {
          const res = await api.employees.get(employee.id);
          if (!isMounted || !res) return;

          setDetailedEmployee(res);

          const anyRes = res as any;
          const empData = anyRes.employee || anyRes;
          const userData = anyRes.user || anyRes;

          const fName =
            empData.first_name ||
            anyRes.first_name ||
            anyRes.full_name?.split(' ')[0] ||
            initialFirstName;
          const lName =
            empData.last_name ||
            anyRes.last_name ||
            anyRes.full_name?.split(' ').slice(1).join(' ') ||
            initialLastName;

          const rawPhone =
            empData.phone || anyRes.phone || anyRes.phone_number || userData.phone_number || '';
          const cleanPhone = rawPhone
            ? rawPhone.startsWith('+')
              ? rawPhone
              : `+${rawPhone}`
            : formattedInitialPhone;

          const rawSecPhone = empData.secondary_phone ?? anyRes.secondary_phone ?? '';
          const cleanSecPhone = rawSecPhone
            ? rawSecPhone.startsWith('+')
              ? rawSecPhone
              : `+${rawSecPhone}`
            : '';

          const addr = empData.address ?? anyRes.address ?? '';
          const deptId =
            empData.department_id || empData.department?.id || anyRes.department_id || '';

          const rawSal = empData.fixed_salary ?? anyRes.fixed_salary;
          const salStr =
            rawSal !== undefined && rawSal !== null && rawSal !== '' && !isNaN(Number(rawSal))
              ? parseFloat(String(rawSal)).toString()
              : '';

          const cur = (empData.currency || anyRes.currency || 'UZS') as SupportedCurrency;
          const col = empData.color || anyRes.color || '#CCCCCC';
          const act = empData.is_active ?? anyRes.is_active ?? userData.is_active ?? true;
          const pic = empData.picture_url ?? anyRes.picture_url ?? null;
          const roleName =
            userData.role_details?.name ||
            userData.role ||
            anyRes.user_role ||
            anyRes.role_name ||
            anyRes.role ||
            '';

          setFirstName(fName);
          setLastName(lName);
          setPhone(cleanPhone);
          setSecondaryPhone(cleanSecPhone);
          setAddress(addr);
          setDepartmentId(deptId);
          setFixedSalary(salStr);
          setCurrency(cur);
          setColor(col);
          setIsActive(act);
          setPictureUrl(pic);
          if (roleName) {
            setRole(roleName);
          }
        } catch (err) {
          console.error('Failed to fetch full employee details:', err);
          const error = err as ApiError;
          showNotification(
            t(error?.location || 'internal_error') || 'Failed to fetch employee details',
            'error'
          );
        } finally {
          if (isMounted) {
            setLoadingDetails(false);
          }
        }
      };

      fetchDetails();
      return () => {
        isMounted = false;
      };
    } else if (mode === 'create') {
      setFirstName('');
      setLastName('');
      setPhone('+998');
      setSecondaryPhone('');
      setAddress('');
      setDepartmentId('');
      setFixedSalary('');
      setCurrency('UZS');
      setColor('#CCCCCC');
      setIsActive(true);
      setPictureUrl(null);
      setRole('');
      setErrors({});
      setLoadingDetails(false);
      setDetailedEmployee(null);
    }
  }, [isOpen, mode, employee?.id]);

  const handlePictureUploadClick = () => {
    pictureInputRef.current?.click();
  };

  const handlePictureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = detailedEmployee?.id || employee?.id;
    if (!file || !targetId) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification(t('file_too_large') || 'File is too large (max 5MB)', 'error');
      if (pictureInputRef.current) pictureInputRef.current.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showNotification(
        t('invalid_image_type') || 'Only JPEG, PNG, WEBP, and GIF images are allowed',
        'error'
      );
      if (pictureInputRef.current) pictureInputRef.current.value = '';
      return;
    }

    setUploadingPicture(true);
    try {
      const updated = await api.employees.uploadPicture(targetId, file);
      setPictureUrl(updated.picture_url || null);
      showNotification(t('successPictureUploaded') || 'Picture uploaded successfully!', 'success');
      window.dispatchEvent(new Event('yaqeen_profile_updated'));
    } catch (err) {
      const error = err as ApiError;
      showNotification(
        t(error?.location || 'internal_error') || error?.message || 'Failed to upload photo',
        'error'
      );
    } finally {
      setUploadingPicture(false);
      if (pictureInputRef.current) pictureInputRef.current.value = '';
    }
  };

  const handleDeletePicture = async () => {
    const targetId = detailedEmployee?.id || employee?.id;
    if (!targetId) return;
    setDeletingPicture(true);
    try {
      const updated = await api.employees.deletePicture(targetId);
      setPictureUrl(updated.picture_url || null);
      showNotification(t('successPictureDeleted') || 'Picture deleted successfully!', 'success');
      window.dispatchEvent(new Event('yaqeen_profile_updated'));
    } catch (err) {
      const error = err as ApiError;
      showNotification(
        t(error?.location || 'internal_error') || error?.message || 'Failed to delete photo',
        'error'
      );
    } finally {
      setDeletingPicture(false);
    }
  };

  const validate = (): boolean => {
    const tempErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      tempErrors.firstName = t('fieldRequired') || 'First name is required';
    } else if (firstName.length < 2 || firstName.length > 100) {
      tempErrors.firstName = t('fieldNameLength') || 'Length must be between 2 and 100';
    }

    if (!lastName.trim()) {
      tempErrors.lastName = t('fieldRequired') || 'Last name is required';
    } else if (lastName.length < 2 || lastName.length > 100) {
      tempErrors.lastName = t('fieldNameLength') || 'Length must be between 2 and 100';
    }

    const rawPhone = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      tempErrors.phone = t('fieldRequired') || 'Phone number is required';
    } else if (rawPhone.length < 9 || rawPhone.length > 15) {
      tempErrors.phone = t('fieldPhoneFormat') || 'Valid phone number is required';
    }

    if (secondaryPhone.trim()) {
      const rawSecPhone = secondaryPhone.replace(/\D/g, '');
      if (rawSecPhone.length < 9 || rawSecPhone.length > 15) {
        tempErrors.secondaryPhone = t('fieldPhoneFormat') || 'Valid phone number is required';
      }
    }

    if (!departmentId) {
      tempErrors.departmentId = t('fieldRequired') || 'Department is required';
    }

    if (!role) {
      tempErrors.role = t('fieldRequired') || 'Role is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const selectedRole = availableRoles.find((r) => r.name === role || r.id === role);
    const roleId =
      selectedRole?.id ||
      detailedEmployee?.role_id ||
      detailedEmployee?.user?.role_id ||
      detailedEmployee?.user?.role_details?.id ||
      employee?.role_id ||
      employee?.user?.role_id ||
      '';
    const targetEmployeeId = detailedEmployee?.id || employee?.id;

    setLoading(true);
    try {
      if (mode === 'create') {
        const dto: CreateEmployeeDto = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          secondary_phone: secondaryPhone.trim() || undefined,
          address: address.trim() || undefined,
          department_id: departmentId,
          fixed_salary: fixedSalary.trim() ? parseFloat(fixedSalary).toFixed(2) : undefined,
          currency: fixedSalary.trim() ? currency : undefined,
          color,
          role_id: roleId,
          role,
        };
        await api.employees.create(dto);
        showNotification(t('successEmpCreated') || 'Employee successfully created!', 'success');
      } else if (mode === 'edit' && targetEmployeeId) {
        const dto: UpdateEmployeeDto = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          secondary_phone: secondaryPhone.trim() || undefined,
          address: address.trim() || undefined,
          department_id: departmentId,
          fixed_salary: fixedSalary.trim() ? parseFloat(fixedSalary).toFixed(2) : undefined,
          currency: fixedSalary.trim() ? currency : undefined,
          color,
          is_active: isActive,
          role_id: roleId || undefined,
          role,
        };
        await api.employees.update(targetEmployeeId, dto);
        showNotification(
          t('successEmpUpdated') || 'Employee details successfully updated!',
          'success'
        );
      }
      onSuccess();
    } catch (err) {
      const error = err as ApiError;
      if (error?.location === 'employee_phone_exists') {
        setErrors((prev) => ({
          ...prev,
          phone: t('employee_phone_exists') || 'This phone number is already registered.',
        }));
      } else if (error?.location === 'department_not_found') {
        setErrors((prev) => ({
          ...prev,
          departmentId: t('department_not_found') || 'Department not found.',
        }));
      } else {
        showNotification(
          t(error?.location || 'internal_error') || error?.message || 'Failed to save employee',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const accentColor = color || '#CCCCCC';
  const isDarkText = isColorDark(accentColor);
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'EMP';

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="w-[94vw] sm:w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-surface dark:bg-surface border border-border/40 rounded-2xl overflow-hidden relative shadow-2xl transition-all duration-300 flex flex-col mx-auto my-auto">
          {/* Top visual color border line */}
          <div
            className="h-1.5 w-full transition-colors duration-300"
            style={{ backgroundColor: accentColor }}
          />

          <Modal.CloseTrigger className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-default/50 cursor-pointer focus:outline-none z-10" />

          <Modal.Header className="pt-4 sm:pt-6 pb-3 sm:pb-4 px-4 sm:px-6 shrink-0">
            <Modal.Heading className="font-serif font-bold text-base sm:text-xl flex items-center gap-2">
              <span
                className="p-1 rounded-lg"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                <User className="size-4 sm:size-5" />
              </span>
              <span>
                {mode === 'create'
                  ? t('empNewEmployee') || 'Register New Employee'
                  : t('empEditEmployee') || 'Edit Employee Profile'}
              </span>
              {loadingDetails && (
                <span className="inline-flex items-center gap-1.5 ml-2 text-xs font-normal text-muted">
                  <Spinner size="sm" />
                </span>
              )}
            </Modal.Heading>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-3 sm:gap-4 py-2 px-3.5 sm:px-6 overflow-y-auto flex-1">
            {/* 1. Live Interactive Profile Header */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-default-50/50 dark:bg-default-50/5 border border-border/20">
              <input
                type="file"
                ref={pictureInputRef}
                onChange={handlePictureFileChange}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
              />

              {/* Dynamic Avatar Container */}
              <div className="relative group shrink-0">
                <Avatar
                  className="size-16 sm:size-20 border-2 shadow-md relative overflow-hidden transition-all duration-300"
                  style={{ borderColor: accentColor }}
                >
                  {pictureUrl && (
                    <Avatar.Image src={getImageUrl(pictureUrl)} alt={`${firstName} ${lastName}`} />
                  )}
                  <Avatar.Fallback
                    className="text-lg sm:text-xl font-bold tracking-wider"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                  >
                    {initials}
                  </Avatar.Fallback>
                </Avatar>

                {mode === 'edit' &&
                  employee?.id &&
                  (uploadingPicture || deletingPicture ? (
                    <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center">
                      <Spinner size="sm" style={{ color: accentColor }} />
                    </div>
                  ) : (
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-[1px]">
                      <button
                        type="button"
                        onClick={handlePictureUploadClick}
                        title={
                          pictureUrl
                            ? t('profileChangePicture') || 'Change Picture'
                            : t('profileUploadPicture') || 'Upload Picture'
                        }
                        className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
                      >
                        <Camera className="size-3.5" />
                      </button>
                      {pictureUrl && (
                        <button
                          type="button"
                          onClick={handleDeletePicture}
                          title={t('profileDeletePicture') || 'Delete Picture'}
                          className="p-1.5 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>

              {/* Live Preview Text Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
                  {firstName.trim() || lastName.trim()
                    ? `${firstName} ${lastName}`
                    : t('empNewEmployee') || 'New Employee'}
                </h4>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-royal/10 dark:bg-night-royal/15 text-brand-royal dark:text-night-royal uppercase tracking-wider">
                    {role || 'Role'}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border"
                    style={{
                      borderColor: `${accentColor}40`,
                      color: accentColor,
                      backgroundColor: `${accentColor}10`,
                    }}
                  >
                    <Palette className="size-3" />
                    Accent: {accentColor.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted mt-1 max-w-md">
                  {mode === 'edit'
                    ? t('profileChangePicture') || 'Click camera overlay to upload a profile photo'
                    : 'Profile photo upload will be available after registration'}
                </p>
              </div>
            </div>

            {/* 2. Automatic Linkage Banner */}
            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-brand-gold/10 border border-brand-gold/20">
              <ShieldCheck className="size-4 sm:size-4.5 text-brand-gold shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">
                  {t('autoAccountLinkage') || 'Automatic Account Linkage'}
                </p>
                <p className="text-[10px] text-muted leading-relaxed mt-0.5">
                  Entering the primary phone number automatically connects their system user account
                  and sets up their login role sync.
                </p>
              </div>
            </div>

            {/* 3. Form Grid: Group 1: Personal Details */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-default-50/30 dark:bg-default-50/5 border border-border/25 flex flex-col gap-3 sm:gap-4 text-left">
              <h4 className="text-xs font-bold text-brand-royal dark:text-night-royal flex items-center gap-1.5 uppercase tracking-wider mb-0.5 sm:mb-1">
                <User className="size-3.5" />
                {t('groupPersonalDetails') || 'Personal Details'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('fieldFirstName') || 'First Name'} *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setErrors((p) => ({ ...p, firstName: '' }));
                    }}
                    placeholder="Artyom"
                    className={`w-full px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 ${
                      errors.firstName
                        ? 'border-rose-500 focus:ring-rose-500/30'
                        : 'border-field-border'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-0.5">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('fieldLastName') || 'Last Name'} *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setErrors((p) => ({ ...p, lastName: '' }));
                    }}
                    placeholder="Kovalyov"
                    className={`w-full px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 ${
                      errors.lastName
                        ? 'border-rose-500 focus:ring-rose-500/30'
                        : 'border-field-border'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-0.5">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  {t('fieldRole') || 'System Access Role'} *
                </label>
                {loadingRoles ? (
                  <div className="flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-xl border border-field-border bg-field text-xs sm:text-sm text-muted">
                    <Spinner size="sm" />
                    <span>{t('loadingRoles') || 'Loading roles...'}</span>
                  </div>
                ) : (
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setErrors((p) => ({ ...p, role: '' }));
                    }}
                    className={`w-full px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 cursor-pointer ${
                      errors.role ? 'border-rose-500 focus:ring-rose-500/30' : 'border-field-border'
                    }`}
                  >
                    <option value="">{t('fieldSelectRole') || 'Select Role'}</option>
                    {availableRoles.map((roleObj) => (
                      <option key={roleObj.id} value={roleObj.name}>
                        {roleObj.display_name} ({roleObj.name})
                      </option>
                    ))}
                  </select>
                )}
                {errors.role && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-0.5">{errors.role}</p>
                )}
              </div>
            </div>

            {/* 4. Form Grid: Group 2: Contact Info */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-default-50/30 dark:bg-default-50/5 border border-border/25 flex flex-col gap-3 sm:gap-4 text-left">
              <h4 className="text-xs font-bold text-brand-royal dark:text-night-royal flex items-center gap-1.5 uppercase tracking-wider mb-0.5 sm:mb-1">
                <Phone className="size-3.5" />
                {t('groupContactInfo') || 'Contact Information'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <PhoneInput
                  value={phone}
                  onChange={(val) => {
                    setPhone(val);
                    setErrors((p) => ({ ...p, phone: '' }));
                  }}
                  error={errors.phone}
                  label={t('fieldPhone') || 'Primary Phone'}
                  isRequired
                />

                <PhoneInput
                  value={secondaryPhone}
                  onChange={(val) => {
                    setSecondaryPhone(val);
                    setErrors((p) => ({ ...p, secondaryPhone: '' }));
                  }}
                  error={errors.secondaryPhone}
                  label={t('fieldSecondaryPhone') || 'Secondary Phone'}
                  isRequired={false}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted" />
                  {t('fieldAddress') || 'Address / Living Location'}
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address details..."
                  rows={2}
                  className="w-full px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm bg-field text-field-foreground border border-field-border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 resize-none"
                />
              </div>
            </div>

            {/* 5. Form Grid: Group 3: Work & Compensation */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-default-50/30 dark:bg-default-50/5 border border-border/25 flex flex-col gap-3 sm:gap-4 text-left">
              <h4 className="text-xs font-bold text-brand-royal dark:text-night-royal flex items-center gap-1.5 uppercase tracking-wider mb-0.5 sm:mb-1">
                <Building className="size-3.5" />
                {t('groupWorkDetails') || 'Work & Compensation'}
              </h4>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t('fieldDepartment') || 'Assigned Department'} *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setErrors((p) => ({ ...p, departmentId: '' }));
                  }}
                  className={`w-full px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm bg-field text-field-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 cursor-pointer ${
                    errors.departmentId
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-field-border'
                  }`}
                >
                  <option value="">{t('fieldSelectDept') || 'Select Department'}</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.display_name}
                    </option>
                  ))}
                </select>
                {errors.departmentId && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-0.5">
                    {errors.departmentId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Coins className="size-3.5 text-muted" />
                    {t('fieldSalary') || 'Fixed Base Salary'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted font-mono select-none">
                      {currency === 'UZS' ? "so'm" : currency === 'USD' ? '$' : '₽'}
                    </span>
                    <input
                      type="number"
                      value={fixedSalary}
                      onChange={(e) => setFixedSalary(e.target.value)}
                      placeholder="3500000"
                      className="w-full pl-14 pr-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm bg-field text-field-foreground border border-field-border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t('fieldCurrency') || 'Currency'}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                    className="w-full px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm bg-field text-field-foreground border border-field-border transition-colors focus:outline-none focus:ring-2 focus:ring-focus/30 cursor-pointer font-mono"
                  >
                    <option value="UZS">UZS</option>
                    <option value="USD">USD</option>
                    <option value="RUB">RUB</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 6. Form Grid: Group 4: Visual Accent & Status */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-default-50/30 dark:bg-default-50/5 border border-border/25 flex flex-col gap-3 sm:gap-4 text-left">
              <h4 className="text-xs font-bold text-brand-royal dark:text-night-royal flex items-center gap-1.5 uppercase tracking-wider mb-0.5 sm:mb-1">
                <Palette className="size-3.5" />
                {t('fieldColor') || 'Personalization & Accent Color'}
              </h4>

              <div className="flex flex-col gap-2.5 sm:gap-3">
                <label className="text-xs font-semibold text-foreground">
                  {t('selectTagColor') || 'Choose Employee Accent Color:'}
                </label>

                <div className="flex items-center gap-2 flex-wrap">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColor(preset)}
                      className="size-7 sm:size-8 rounded-full border-2 transition-all relative cursor-pointer"
                      style={{
                        backgroundColor: preset,
                        borderColor: color === preset ? '#ffffff' : 'transparent',
                        boxShadow: color === preset ? `0 0 12px 2px ${preset}80` : 'none',
                        transform: color === preset ? 'scale(1.15)' : 'none',
                      }}
                    >
                      {color === preset && (
                        <span className="absolute inset-0 m-auto size-2 bg-white rounded-full mix-blend-difference" />
                      )}
                    </button>
                  ))}

                  {/* Custom color picker row */}
                  <div className="flex items-center gap-1.5 border border-field-border bg-field rounded-xl px-2 py-1 shrink-0 transition-colors focus-within:ring-2 focus-within:ring-focus/25">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="size-5 border-0 p-0 cursor-pointer bg-transparent rounded"
                    />
                    <span className="text-xs font-mono font-bold uppercase select-all text-field-foreground">
                      {color}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status toggler (Active / Inactive) */}
              {mode === 'edit' && (
                <div className="flex items-center justify-between border border-border/20 rounded-2xl p-2.5 sm:p-3 bg-default-100/35 dark:bg-default-50/10 mt-1">
                  <div>
                    <span className="text-xs font-bold text-foreground">
                      {t('fieldIsActive') || 'Employee Work Status'}
                    </span>
                    <p className="text-[10px] text-muted mt-0.5">
                      {isActive
                        ? t('statusActive') || 'Active employee (full system access)'
                        : t('statusInactive') || 'Suspended / Inactive'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-focus/30 ${
                      isActive ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  >
                    <span
                      className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/20 flex items-center justify-end gap-2.5 sm:gap-3 bg-default-50/20 dark:bg-default-50/2 shrink-0">
            <Button
              variant="ghost"
              onPress={onClose}
              className="flex-1 sm:flex-initial font-semibold text-xs sm:text-sm rounded-xl text-muted hover:text-foreground border border-border/40 hover:bg-default/50"
            >
              {t('actionCancel') || 'Cancel'}
            </Button>
            <Button
              onPress={() => handleSave()}
              isDisabled={loading}
              style={{
                backgroundColor: accentColor,
                color: isDarkText ? '#ffffff' : '#11213D',
              }}
              className="flex-1 sm:flex-initial font-semibold text-xs sm:text-sm rounded-xl min-w-[110px] sm:min-w-[130px] shadow-md hover:brightness-95 active:brightness-90 active:scale-98 transition-all"
            >
              {loading ? (
                <>
                  <Spinner size="sm" color="current" className="mr-2" />
                  {mode === 'create'
                    ? t('actionCreating') || 'Registering...'
                    : t('actionSaving') || 'Saving...'}
                </>
              ) : mode === 'create' ? (
                t('actionCreate') || 'Register'
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
