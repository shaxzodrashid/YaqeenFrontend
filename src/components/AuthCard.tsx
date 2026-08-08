import { useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import type { ApiError } from '../services/api';
import { PhoneInput } from './PhoneInput';
import { TelegramInstructions } from './TelegramInstructions';
import { YaqeenMark } from './icons/YaqeenIcons';
import { T } from './T';

export interface AuthCardProps {
  onSuccess: (phone: string, method: string) => void;
}

type AuthTab = 'signin' | 'register' | 'forgot';
type MultiStep = 'phone' | 'otp' | 'password';

export function AuthCard({ onSuccess }: AuthCardProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Common Form States
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');

  // Step state for multi-step flows (register / forgot)
  const [step, setStep] = useState<MultiStep>('phone');

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setTempToken('');
    setStep('phone');
    setFormError(null);
    setFieldErrors({});
    setShowTelegramGuide(false);
  };

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    resetForm();
  };

  /* ── 1. Sign In Handler ─────────────────────────────────── */
  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setShowTelegramGuide(false);

    if (!phone || phone.length < 9) {
      setFieldErrors({ phone: t('fieldRequired') || 'Phone number is required' });
      return;
    }
    if (!password) {
      setFieldErrors({ password: t('fieldRequired') || 'Password is required' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(phone, password, isAdminMode);
      showNotification(t('welcomeBack') || 'Successfully signed in!', 'success');
      onSuccess(res.user?.phone_number || phone, isAdminMode ? 'ROP Admin' : 'Employee');
    } catch (err) {
      const error = err as ApiError;
      if (error?.location === 'invalid_login') {
        setFormError(t('invalid_login') || 'Invalid phone number or password');
      } else if (error?.location === 'account_banned') {
        setFormError(t('account_banned') || 'This account has been banned.');
      } else if (error?.location === 'account_pending') {
        setFormError(t('account_pending') || 'Account registration is pending approval.');
      } else {
        setFormError(
          t(error?.location || 'internal_error') || error?.message || 'Authentication failed'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── 2. Send OTP Handler (Register / Forgot) ─────────────── */
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setShowTelegramGuide(false);

    if (!phone || phone.length < 9) {
      setFieldErrors({ phone: t('fieldRequired') || 'Phone number is required' });
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'register') {
        await api.registerSendOtp(phone);
      } else {
        await api.resetSendOtp(phone);
      }
      showNotification(t('otpSentMessage') || 'OTP code sent via Telegram', 'info');
      setStep('otp');
    } catch (err) {
      const error = err as ApiError;
      if (error?.location === 'telegram_not_registered') {
        setShowTelegramGuide(true);
      } else {
        setFormError(
          t(error?.location || 'internal_error') || error?.message || 'Failed to send OTP code'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── 3. Verify OTP Handler ────────────────────────────────── */
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!otp || otp.length < 4) {
      setFieldErrors({ otp: t('fieldRequired') || 'Enter valid OTP code' });
      return;
    }

    setLoading(true);
    try {
      let res: { token: string };
      if (activeTab === 'register') {
        res = await api.registerVerifyOtp(phone, otp);
      } else {
        res = await api.resetVerifyOtp(phone, otp);
      }
      setTempToken(res.token);
      setStep('password');
    } catch (err) {
      const error = err as ApiError;
      setFormError(t(error?.location || 'invalid_otp') || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  /* ── 4. Set Password Handler ──────────────────────────────── */
  const handleSetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!password || password.length < 6) {
      setFieldErrors({
        password: t('minPasswordLength', { min: 6 }) || 'Password must be at least 6 characters',
      });
      return;
    }
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: t('passwords_do_not_match') || 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'register') {
        await api.registerSetPassword(tempToken, password, confirmPassword);
        showNotification(
          t('btnCreatingAccount') || 'Account created successfully! Please sign in.',
          'success'
        );
      } else {
        await api.resetSetPassword(tempToken, password, confirmPassword);
        showNotification(
          t('btnSubmittingPassword') || 'Password reset successfully! Please sign in.',
          'success'
        );
      }
      setActiveTab('signin');
      resetForm();
    } catch (err) {
      const error = err as ApiError;
      setFormError(
        t(error?.location || 'internal_error') || error?.message || 'Failed to update password'
      );
    } finally {
      setLoading(false);
    }
  };

  const isFlipped = activeTab !== 'signin';

  return (
    <div className="w-full max-w-md flex flex-col items-center select-none">
      {/* ── HIGH-END SEGMENTED SWITCH BUTTON ─────────────────────────── */}
      <div className="relative flex items-center p-1.5 mb-6 bg-neutral-200/50 dark:bg-night-surface/90 border border-neutral-300/70 dark:border-border/80 rounded-2xl shadow-inner backdrop-blur-xl w-full">
        {/* Tab 1: Sign In */}
        <button
          type="button"
          onClick={() => handleTabChange('signin')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors duration-300 cursor-pointer select-none ${
            !isFlipped
              ? 'text-brand-navy dark:text-brand-gold'
              : 'text-neutral-500 dark:text-muted hover:text-neutral-800 dark:hover:text-foreground'
          }`}
        >
          {!isFlipped && (
            <motion.div
              layoutId="auth-switch-pill"
              className="absolute inset-0 rounded-xl bg-white dark:bg-night-elevated shadow-lg border border-neutral-200/80 dark:border-border/80"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <LogIn
              className={`size-4 transition-transform duration-300 ${!isFlipped ? 'scale-110 text-[#A88C52] dark:text-brand-gold' : ''}`}
            />
            <span>
              <T k="signIn" />
            </span>
          </span>
        </button>

        {/* Tab 2: Register */}
        <button
          type="button"
          onClick={() => handleTabChange('register')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors duration-300 cursor-pointer select-none ${
            isFlipped
              ? 'text-brand-navy dark:text-brand-gold'
              : 'text-neutral-500 dark:text-muted hover:text-neutral-800 dark:hover:text-foreground'
          }`}
        >
          {isFlipped && (
            <motion.div
              layoutId="auth-switch-pill"
              className="absolute inset-0 rounded-xl bg-white dark:bg-night-elevated shadow-lg border border-neutral-200/80 dark:border-border/80"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <UserPlus
              className={`size-4 transition-transform duration-300 ${isFlipped ? 'scale-110 text-[#A88C52] dark:text-brand-gold' : ''}`}
            />
            <span>
              <T k="createAccount" />
            </span>
          </span>
        </button>
      </div>

      {/* ── 3D TURNING CARD CONTAINER ───────────────────────────────── */}
      <div className="w-full perspective-1200">
        <div
          className={`relative w-full min-h-[480px] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform-style-3d ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* ── FRONT SIDE: SIGN IN ───────────────────────────────────── */}
          <div className="w-full min-h-[480px] flex flex-col justify-between rounded-3xl bg-white/95 dark:bg-overlay/95 backdrop-blur-xl border border-neutral-200/90 dark:border-border/80 p-7 sm:p-8 shadow-2xl dark:shadow-black/60 backface-hidden font-ui text-left">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-border/40">
                <div>
                  <h2 className="text-xl font-bold text-brand-navy dark:text-foreground tracking-tight">
                    <T k="signIn" />
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-muted mt-0.5">
                    Welcome back! Please enter your details.
                  </p>
                </div>
                <div className="size-10 rounded-2xl bg-brand-gold/10 dark:bg-brand-gold/15 flex items-center justify-center border border-brand-gold/20 shrink-0">
                  <YaqeenMark size={24} variant="gold" />
                </div>
              </div>

              {/* Form Error Banner */}
              {formError && !isFlipped && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                <PhoneInput
                  value={phone}
                  onChange={(val) => {
                    setPhone(val);
                    setFieldErrors((p) => ({ ...p, phone: '' }));
                  }}
                  error={fieldErrors.phone}
                  label={t('phoneNumber')}
                  isRequired
                />

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-foreground flex items-center gap-1.5">
                      <Lock className="size-3.5 text-neutral-400" />
                      <T k="password" /> *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTabChange('forgot')}
                      className="text-xs font-semibold text-brand-gold hover:underline cursor-pointer transition-colors"
                    >
                      <T k="forgotPasswordLink" />
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, password: '' }));
                      }}
                      placeholder={t('passwordPlaceholder') || 'Enter your password'}
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-field text-foreground border transition-all focus:outline-none focus:ring-2 focus:ring-brand-gold/30 ${
                        fieldErrors.password
                          ? 'border-rose-500'
                          : 'border-neutral-200 dark:border-field-border'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-foreground cursor-pointer focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isDisabled={loading}
                  className="h-11 bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-bold text-sm rounded-xl transition-all shadow-md shadow-brand-gold/20 cursor-pointer mt-2"
                >
                  {loading ? <Spinner size="sm" /> : <T k="btnSignIn" />}
                </Button>
              </form>
            </div>

            {/* Bottom Footer & Admin Mode Toggle */}
            <div className="pt-4 border-t border-neutral-100 dark:border-border/30 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  isAdminMode
                    ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30 font-semibold'
                    : 'text-neutral-400 dark:text-muted hover:text-neutral-600 dark:hover:text-foreground'
                }`}
              >
                <Shield className="size-3.5" />
                <span>{isAdminMode ? 'Admin Access ON' : 'Admin Mode'}</span>
              </button>

              <div className="text-neutral-500 dark:text-muted">
                <span>New here? </span>
                <button
                  type="button"
                  onClick={() => handleTabChange('register')}
                  className="font-bold text-brand-gold hover:underline cursor-pointer ml-1"
                >
                  {t('createAccount') || 'Register'}
                </button>
              </div>
            </div>
          </div>

          {/* ── BACK SIDE: REGISTER / RESET PASSWORD ──────────────────── */}
          <div
            className={`absolute inset-0 w-full min-h-[480px] flex flex-col justify-between rounded-3xl bg-white/95 dark:bg-overlay/95 backdrop-blur-xl border border-neutral-200/90 dark:border-border/80 p-7 sm:p-8 shadow-2xl dark:shadow-black/60 backface-hidden [transform:rotateY(180deg)] font-ui text-left ${
              !isFlipped ? 'pointer-events-none' : ''
            }`}
          >
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-border/40">
                <div>
                  <h2 className="text-xl font-bold text-brand-navy dark:text-foreground tracking-tight">
                    {activeTab === 'forgot'
                      ? t('forgotPassword') || 'Reset Password'
                      : t('createAccount') || 'Create Account'}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-muted mt-0.5">
                    {activeTab === 'forgot'
                      ? 'Reset your access code safely'
                      : 'Join Yaqeen with simple verification'}
                  </p>
                </div>
                <div className="size-10 rounded-2xl bg-brand-gold/10 dark:bg-brand-gold/15 flex items-center justify-center border border-brand-gold/20 shrink-0">
                  <YaqeenMark size={24} variant="gold" />
                </div>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 dark:text-muted border-b border-neutral-100 dark:border-border/30 pb-2.5">
                <span className={step === 'phone' ? 'text-brand-gold font-extrabold' : ''}>
                  1. <T k="stepPhoneInput" />
                </span>
                <span className={step === 'otp' ? 'text-brand-gold font-extrabold' : ''}>
                  2. <T k="stepOtpVerify" />
                </span>
                <span className={step === 'password' ? 'text-brand-gold font-extrabold' : ''}>
                  3. <T k="stepPasswordSet" />
                </span>
              </div>

              {/* Form Error Banner */}
              {formError && isFlipped && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Telegram Instructions if phone not linked */}
              {showTelegramGuide && <TelegramInstructions botUsername="YaqeenOtpBot" />}

              {/* STEP 1: Phone Input */}
              {step === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <PhoneInput
                    value={phone}
                    onChange={(val) => {
                      setPhone(val);
                      setFieldErrors((p) => ({ ...p, phone: '' }));
                    }}
                    error={fieldErrors.phone}
                    label={t('phoneNumber')}
                    isRequired
                  />

                  <Button
                    type="submit"
                    fullWidth
                    isDisabled={loading}
                    className="h-11 bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-bold text-sm rounded-xl transition-all shadow-md shadow-brand-gold/20 cursor-pointer"
                  >
                    {loading ? <Spinner size="sm" /> : <T k="btnSendOtp" />}
                  </Button>
                </form>
              )}

              {/* STEP 2: OTP Verification */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium">
                    <T k="otpSentMessage" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-foreground flex items-center gap-1.5">
                      <KeyRound className="size-3.5 text-neutral-400" />
                      OTP Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, ''));
                        setFieldErrors((p) => ({ ...p, otp: '' }));
                      }}
                      placeholder={t('enterOtpPlaceholder') || 'Enter 6-digit code'}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-center text-base font-mono tracking-widest bg-neutral-50 dark:bg-field text-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold/30 ${
                        fieldErrors.otp
                          ? 'border-rose-500'
                          : 'border-neutral-200 dark:border-field-border'
                      }`}
                    />
                    {fieldErrors.otp && (
                      <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.otp}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onPress={() => setStep('phone')}
                      className="h-11 font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      <ArrowLeft className="size-4 mr-1" />
                      <T k="actionBack" />
                    </Button>
                    <Button
                      type="submit"
                      fullWidth
                      isDisabled={loading}
                      className="h-11 bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-bold text-sm rounded-xl transition-all shadow-md shadow-brand-gold/20 cursor-pointer"
                    >
                      {loading ? <Spinner size="sm" /> : <T k="btnVerifyCode" />}
                    </Button>
                  </div>
                </form>
              )}

              {/* STEP 3: Set Password */}
              {step === 'password' && (
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    <span>Verification successful. Please set your password.</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-foreground flex items-center gap-1.5">
                      <Lock className="size-3.5 text-neutral-400" />
                      <T k="password" /> *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, password: '' }));
                      }}
                      placeholder={t('passwordPlaceholder') || 'Enter password'}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-field text-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold/30 ${
                        fieldErrors.password
                          ? 'border-rose-500'
                          : 'border-neutral-200 dark:border-field-border'
                      }`}
                    />
                    {fieldErrors.password && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-foreground flex items-center gap-1.5">
                      <Lock className="size-3.5 text-neutral-400" />
                      <T k="confirmPassword" /> *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, confirmPassword: '' }));
                      }}
                      placeholder={t('confirmPasswordPlaceholder') || 'Confirm password'}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-field text-foreground border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold/30 ${
                        fieldErrors.confirmPassword
                          ? 'border-rose-500'
                          : 'border-neutral-200 dark:border-field-border'
                      }`}
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    isDisabled={loading}
                    className="h-11 bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-bold text-sm rounded-xl transition-all shadow-md shadow-brand-gold/20 cursor-pointer"
                  >
                    {loading ? <Spinner size="sm" /> : <T k="btnSubmitNewPassword" />}
                  </Button>
                </form>
              )}
            </div>

            {/* Bottom Footer Switch back to Sign In */}
            <div className="pt-4 border-t border-neutral-100 dark:border-border/30 flex items-center justify-center text-xs">
              <span className="text-neutral-500 dark:text-muted">Already have an account? </span>
              <button
                type="button"
                onClick={() => handleTabChange('signin')}
                className="font-bold text-brand-gold hover:underline cursor-pointer ml-1"
              >
                {t('signIn') || 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
