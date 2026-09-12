import type { Locale } from '../../context/LanguageContext';

export const localeCodeMap: Record<Locale, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
};

export function getLocaleCode(locale: Locale): string {
  return localeCodeMap[locale] || 'en-US';
}

export function formatYearMonth(yearMonthStr: string, locale: Locale): string {
  try {
    const [year, month] = yearMonthStr.split('-').map(Number);
    if (!year || !month) return yearMonthStr;
    const date = new Date(year, month - 1, 1);
    const formatted = date.toLocaleDateString(getLocaleCode(locale), {
      month: 'long',
      year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return yearMonthStr;
  }
}

export function formatDateLocale(dateStr: string, locale: Locale): string {
  try {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString(getLocaleCode(locale), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatCareerLevel(level: string, t: (k: string) => string): string {
  switch (level?.toUpperCase()) {
    case 'JUNIOR':
      return t('careerLevelJunior') || 'Junior';
    case 'MID':
      return t('careerLevelMid') || 'Mid';
    case 'SENIOR':
      return t('careerLevelSenior') || 'Senior';
    case 'EXPERT':
      return t('careerLevelExpert') || 'Expert';
    default:
      return level || '';
  }
}

export function formatDeptName(deptName: string | undefined, t: (k: string) => string): string {
  if (!deptName) return '';
  if (deptName === 'Sales Department') {
    return t('deptSalesDepartment') || 'Sales Department';
  }
  return deptName;
}

export function formatApprovalStatus(status: string | undefined, t: (k: string) => string): string {
  if (!status) return '';
  switch (status) {
    case 'PROMOTION_PENDING_REVIEW':
      return t('kpiAlertStatusPromotionPending') || 'Promotion Pending';
    case 'DEMOTION_PENDING_REVIEW':
      return t('kpiAlertStatusDemotionPending') || 'Demotion Pending';
    case 'PROMOTED_APPROVED':
      return t('kpiAlertStatusPromoted') || 'Promoted';
    case 'DEMOTED_APPROVED':
      return t('kpiAlertStatusDemoted') || 'Demoted';
    case 'MAINTAINED_APPROVED':
      return t('kpiAlertStatusMaintained') || 'Maintained';
    case 'REJECTED':
      return t('kpiAlertStatusRejected') || 'Rejected';
    case 'ACTIVE_COMPLIANT':
      return t('kpiAlertStatusCompliant') || 'Active Compliant';
    case 'UNDERPERFORMING_WATCH':
      return t('kpiAlertStatusUnderperforming') || 'Underperforming Watch';
    default:
      return status.replace(/_/g, ' ');
  }
}
