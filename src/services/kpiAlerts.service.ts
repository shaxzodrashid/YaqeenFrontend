import { request, registerDemoHandler } from './httpClient';
import type {
  KpiAlertPopupResponse,
  KpiDecisionDto,
  BulkKpiDecisionDto,
  BulkDecisionResponse,
  ReviewPromotionDedicatedDto,
  ReviewDemotionDedicatedDto,
  KpiAlertSuggestion,
  KpiEmployeeEvaluation,
} from '../types/kpiAlerts';

// ---------------------------------------------------------------------------
// Demo Mock Database for KPI Alerts & Month-End Review
// ---------------------------------------------------------------------------

let demoSuggestionsDb: KpiAlertSuggestion[] = [
  {
    alert_id: '8b08ffae-967f-4f30-b384-e9185a49c6cb',
    evaluation_id: '017830aa-b934-45e3-9975-ad38e9da32a3',
    employee_id: 'b9687e5b-b9b5-4b53-b09e-3d1223e7bfb5',
    employee_name: 'Aziz Rahimov',
    department_name: 'Sales Department',
    phone: '+998901234567',
    decision_type: 'PROMOTION',
    current_level: 'JUNIOR',
    suggested_level: 'MID',
    current_salary: 300.0,
    suggested_salary: 500.0,
    approval_status: 'PROMOTION_PENDING_REVIEW',
    consecutive_successes: 2,
    consecutive_failures: 0,
    mentees_count: 0,
    mentees_required: 0,
    metrics: {
      total_sales: 3200.0,
      deal_count: 10,
      average_check: 320.0,
      plan_target_min: 3000.0,
      plan_target_max: 3000.0,
      sales_bonus_amount: 320.0,
      total_earnings: 620.0,
      is_plan_achieved: true,
      is_sr_check_achieved: true,
    },
  },
  {
    alert_id: 'c1f7b09e-1111-4f4f-b888-abcdef123456',
    evaluation_id: '99281726-ccbb-4112-a123-112233445566',
    employee_id: 'd8e7c6b5-a432-4111-b222-998877665544',
    employee_name: 'Jasur Bek',
    department_name: 'Sales Department',
    phone: '+998909876543',
    decision_type: 'DEMOTION',
    current_level: 'MID',
    suggested_level: 'JUNIOR',
    current_salary: 500.0,
    suggested_salary: 300.0,
    approval_status: 'DEMOTION_PENDING_REVIEW',
    consecutive_successes: 0,
    consecutive_failures: 2,
    mentees_count: 0,
    mentees_required: 0,
    metrics: {
      total_sales: 1200.0,
      deal_count: 4,
      average_check: 300.0,
      plan_target_min: 5000.0,
      plan_target_max: 6000.0,
      sales_bonus_amount: 0.0,
      total_earnings: 500.0,
      is_plan_achieved: false,
      is_sr_check_achieved: false,
    },
  },
  {
    alert_id: 'd2e8c11a-2222-4a4a-9999-fedcba654321',
    evaluation_id: '88392019-bbcc-4223-b234-223344556677',
    employee_id: 'e9f8d7c6-b543-4222-c333-112233445566',
    employee_name: 'Malika Umarova',
    department_name: 'Sales Department',
    phone: '+998933334455',
    decision_type: 'PROMOTION',
    current_level: 'MID',
    suggested_level: 'SENIOR',
    current_salary: 500.0,
    suggested_salary: 700.0,
    approval_status: 'PROMOTION_PENDING_REVIEW',
    consecutive_successes: 3,
    consecutive_failures: 0,
    mentees_count: 1,
    mentees_required: 1,
    metrics: {
      total_sales: 6800.0,
      deal_count: 14,
      average_check: 485.71,
      plan_target_min: 5000.0,
      plan_target_max: 6000.0,
      sales_bonus_amount: 1360.0,
      total_earnings: 1860.0,
      is_plan_achieved: true,
      is_sr_check_achieved: true,
    },
  },
];

let demoEmployeesKpiDb: KpiEmployeeEvaluation[] = [
  {
    evaluation_id: '017830aa-b934-45e3-9975-ad38e9da32a3',
    employee_id: 'b9687e5b-b9b5-4b53-b09e-3d1223e7bfb5',
    employee_name: 'Aziz Rahimov',
    department_name: 'Sales Department',
    career_level: 'JUNIOR',
    fixed_salary: 300.0,
    total_sales: 3200.0,
    deal_count: 10,
    average_check: 320.0,
    plan_target_min: 3000.0,
    plan_target_max: 3000.0,
    plan_progress_percentage: 106.67,
    is_plan_achieved: true,
    is_sr_check_achieved: true,
    sales_bonus_amount: 320.0,
    paid_sales_bonus_amount: 250.0,
    unpaid_sales_bonus_amount: 70.0,
    additional_bonus_amount: 0.0,
    total_earnings: 620.0,
    consecutive_successes: 2,
    consecutive_failures: 0,
    approval_status: 'PROMOTION_PENDING_REVIEW',
    reviewed_by: null,
    review_notes: null,
  },
  {
    evaluation_id: '99281726-ccbb-4112-a123-112233445566',
    employee_id: 'd8e7c6b5-a432-4111-b222-998877665544',
    employee_name: 'Jasur Bek',
    department_name: 'Sales Department',
    career_level: 'MID',
    fixed_salary: 500.0,
    total_sales: 1200.0,
    deal_count: 4,
    average_check: 300.0,
    plan_target_min: 5000.0,
    plan_target_max: 6000.0,
    plan_progress_percentage: 24.0,
    is_plan_achieved: false,
    is_sr_check_achieved: false,
    sales_bonus_amount: 0.0,
    paid_sales_bonus_amount: 0.0,
    unpaid_sales_bonus_amount: 0.0,
    additional_bonus_amount: 0.0,
    total_earnings: 500.0,
    consecutive_successes: 0,
    consecutive_failures: 2,
    approval_status: 'DEMOTION_PENDING_REVIEW',
    reviewed_by: null,
    review_notes: null,
  },
  {
    evaluation_id: '88392019-bbcc-4223-b234-223344556677',
    employee_id: 'e9f8d7c6-b543-4222-c333-112233445566',
    employee_name: 'Malika Umarova',
    department_name: 'Sales Department',
    career_level: 'MID',
    fixed_salary: 500.0,
    total_sales: 6800.0,
    deal_count: 14,
    average_check: 485.71,
    plan_target_min: 5000.0,
    plan_target_max: 6000.0,
    plan_progress_percentage: 113.33,
    is_plan_achieved: true,
    is_sr_check_achieved: true,
    sales_bonus_amount: 1360.0,
    paid_sales_bonus_amount: 1000.0,
    unpaid_sales_bonus_amount: 360.0,
    additional_bonus_amount: 100.0,
    total_earnings: 1960.0,
    consecutive_successes: 3,
    consecutive_failures: 0,
    approval_status: 'PROMOTION_PENDING_REVIEW',
    reviewed_by: null,
    review_notes: null,
  },
  {
    evaluation_id: '77281908-aacc-4112-9988-334455667788',
    employee_id: 'f0a9b8c7-d654-4333-e444-223344556677',
    employee_name: 'Farhod Aliyev',
    department_name: 'Sales Department',
    career_level: 'SENIOR',
    fixed_salary: 700.0,
    total_sales: 9200.0,
    deal_count: 18,
    average_check: 511.11,
    plan_target_min: 6001.0,
    plan_target_max: 8000.0,
    plan_progress_percentage: 115.0,
    is_plan_achieved: true,
    is_sr_check_achieved: true,
    sales_bonus_amount: 2024.0,
    paid_sales_bonus_amount: 2024.0,
    unpaid_sales_bonus_amount: 0.0,
    additional_bonus_amount: 200.0,
    total_earnings: 2924.0,
    consecutive_successes: 4,
    consecutive_failures: 0,
    approval_status: 'APPROVED',
    reviewed_by: 'System Auto-Approval',
    review_notes: 'Target completed with distinction',
  },
  {
    evaluation_id: '66170897-99bb-4001-8877-445566778899',
    employee_id: 'a1b2c3d4-e5f6-4777-8888-9900aabbccdd',
    employee_name: 'Sardor Rustamov',
    department_name: 'Sales Department',
    career_level: 'JUNIOR',
    fixed_salary: 300.0,
    total_sales: 2100.0,
    deal_count: 9,
    average_check: 233.33,
    plan_target_min: 0.0,
    plan_target_max: 3000.0,
    plan_progress_percentage: 70.0,
    is_plan_achieved: true,
    is_sr_check_achieved: true,
    sales_bonus_amount: 210.0,
    paid_sales_bonus_amount: 150.0,
    unpaid_sales_bonus_amount: 60.0,
    additional_bonus_amount: 0.0,
    total_earnings: 510.0,
    consecutive_successes: 1,
    consecutive_failures: 0,
    approval_status: 'APPROVED',
    reviewed_by: null,
    review_notes: null,
  },
];

let dismissedAlertIds = new Set<string>();

// ---------------------------------------------------------------------------
// Register Demo Fallback Handlers
// ---------------------------------------------------------------------------

registerDemoHandler((path: string, options: RequestInit, body: any) => {
  const method = (options?.method || 'GET').toUpperCase();
  const urlObj = new URL(`http://dummy${path}`);
  const pathname = urlObj.pathname;

  // 1. Month-End Pop-up Data
  if (pathname.includes('/kpi-alerts/popup') && method === 'GET') {
    const month = urlObj.searchParams.get('month') || '2026-09';
    const forcePopup = urlObj.searchParams.get('force_popup') === 'true';

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10) || 2026;
    const monthNum = parseInt(monthStr, 10) || 9;
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const currentDay = 26; // Simulating month-end window
    const lastWeekStartDay = Math.max(22, daysInMonth - 6);
    const isLastWeek = currentDay >= lastWeekStartDay;

    const activeSuggestions = demoSuggestionsDb.filter((s) => !dismissedAlertIds.has(s.alert_id));

    const promotionsCount = activeSuggestions.filter((s) => s.decision_type === 'PROMOTION').length;
    const demotionsCount = activeSuggestions.filter((s) => s.decision_type === 'DEMOTION').length;
    const srCheckCount = activeSuggestions.filter((s) => s.decision_type === 'SR_CHECK').length;
    const totalKpiBonus = demoEmployeesKpiDb.reduce(
      (acc, curr) => acc + curr.sales_bonus_amount,
      0
    );

    const response: KpiAlertPopupResponse = {
      month,
      is_last_week: isLastWeek,
      should_popup: forcePopup || (isLastWeek && activeSuggestions.length > 0),
      period: {
        start_date: `${month}-01`,
        end_date: `${month}-${String(daysInMonth).padStart(2, '0')}`,
        last_week_start: `${month}-${String(lastWeekStartDay).padStart(2, '0')}`,
        current_day: currentDay,
        total_days: daysInMonth,
        days_remaining: Math.max(0, daysInMonth - currentDay),
      },
      summary: {
        total_employees: demoEmployeesKpiDb.length,
        total_kpi_bonus: totalKpiBonus,
        pending_decisions_count: activeSuggestions.length,
        promotions_count: promotionsCount,
        demotions_count: demotionsCount,
        sr_check_approvals_count: srCheckCount,
      },
      suggestions: activeSuggestions,
      employees_kpi: demoEmployeesKpiDb,
    };

    return { handled: true, result: response };
  }

  // 2. Single Decision Action
  if (pathname.includes('/kpi-alerts/decide') && method === 'POST') {
    const parsedBody: KpiDecisionDto = body || {};
    const evalId = parsedBody.evaluation_id;
    const alertId = parsedBody.alert_id;

    const idx = demoSuggestionsDb.findIndex(
      (s) => (alertId && s.alert_id === alertId) || (evalId && s.evaluation_id === evalId)
    );

    if (idx !== -1) {
      const item = demoSuggestionsDb[idx];
      if (parsedBody.action === 'APPROVE') {
        if (item.decision_type === 'PROMOTION') {
          item.approval_status = 'PROMOTION_APPROVED';
          item.current_level = item.suggested_level;
          if (parsedBody.update_salary !== false) {
            item.current_salary = parsedBody.new_salary || item.suggested_salary;
          }
        } else if (item.decision_type === 'DEMOTION') {
          item.approval_status = 'DEMOTION_APPROVED';
          item.current_level = item.suggested_level;
          if (parsedBody.update_salary !== false) {
            item.current_salary = parsedBody.new_salary || item.suggested_salary;
          }
        }
      } else if (parsedBody.action === 'REJECT') {
        item.approval_status =
          item.decision_type === 'PROMOTION' ? 'PROMOTION_REJECTED' : 'DEMOTION_REJECTED';
      } else if (parsedBody.action === 'MAINTAIN') {
        item.approval_status = 'LEVEL_MAINTAINED';
      }

      const empEval = demoEmployeesKpiDb.find((e) => e.evaluation_id === item.evaluation_id);
      if (empEval) {
        empEval.approval_status = item.approval_status;
        empEval.career_level = item.current_level;
        if (parsedBody.update_salary !== false) {
          empEval.fixed_salary = item.current_salary;
        }
        empEval.review_notes = parsedBody.review_notes || 'Decided by CEO';
      }

      demoSuggestionsDb.splice(idx, 1);
    }

    return { handled: true, result: { success: true, message: 'Decision executed successfully' } };
  }

  // 3. Bulk Decisions Action
  if (pathname.includes('/kpi-alerts/bulk-decide') && method === 'POST') {
    const parsedBody: BulkKpiDecisionDto = body || {};
    const decisions = parsedBody.decisions || [];

    for (const dec of decisions) {
      const idx = demoSuggestionsDb.findIndex(
        (s) =>
          (dec.alert_id && s.alert_id === dec.alert_id) ||
          (dec.evaluation_id && s.evaluation_id === dec.evaluation_id)
      );
      if (idx !== -1) {
        demoSuggestionsDb.splice(idx, 1);
      }
    }

    return {
      handled: true,
      result: {
        total_requested: decisions.length,
        successful_count: decisions.length,
        failed_count: 0,
        results: decisions.map((d) => ({
          evaluation_id: d.evaluation_id,
          status: 'success',
        })),
        errors: [],
      },
    };
  }

  // 4. Dismiss Pop-up Alert
  if (pathname.match(/\/kpi-alerts\/[^/]+\/dismiss/) && method === 'POST') {
    const parts = pathname.split('/');
    const alertId = parts[parts.indexOf('kpi-alerts') + 1];
    if (alertId) {
      dismissedAlertIds.add(alertId);
    }
    return { handled: true, result: { success: true, message: 'Alert dismissed successfully' } };
  }

  return null;
});

// ---------------------------------------------------------------------------
// Production API Service
// ---------------------------------------------------------------------------

export const kpiAlertsApi = {
  /**
   * Retrieves month-end pop-up and executive KPI review data.
   */
  getPopupData: (
    params: { month?: string; force_popup?: boolean } = {}
  ): Promise<KpiAlertPopupResponse> => {
    const query = new URLSearchParams();
    if (params.month) query.set('month', params.month);
    if (params.force_popup !== undefined) query.set('force_popup', String(params.force_popup));

    const qs = query.toString();
    return request<KpiAlertPopupResponse>(`/kpi-alerts/popup${qs ? `?${qs}` : ''}`);
  },

  /**
   * Single decision action (Promotion, Demotion, SR Check).
   */
  makeDecision: (
    dto: KpiDecisionDto
  ): Promise<{ success: boolean; message?: string; data?: any }> => {
    return request<{ success: boolean; message?: string; data?: any }>('/kpi-alerts/decide', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Bulk decisions for multiple pending suggestions.
   */
  makeBulkDecision: (dto: BulkKpiDecisionDto): Promise<BulkDecisionResponse> => {
    return request<BulkDecisionResponse>('/kpi-alerts/bulk-decide', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Dismisses a specific pop-up alert so it doesn't repeatedly prompt.
   */
  dismissAlert: (alertId: string): Promise<{ success: boolean; message?: string }> => {
    return request<{ success: boolean; message?: string }>(`/kpi-alerts/${alertId}/dismiss`, {
      method: 'POST',
    });
  },

  /**
   * Dedicated promotion review endpoint.
   */
  reviewPromotionDedicated: (
    evaluationId: string,
    dto: ReviewPromotionDedicatedDto
  ): Promise<any> => {
    return request<any>(`/sales-manager-kpi/evaluations/${evaluationId}/review-promotion`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Dedicated demotion review endpoint.
   */
  reviewDemotionDedicated: (
    evaluationId: string,
    dto: ReviewDemotionDedicatedDto
  ): Promise<any> => {
    return request<any>(`/sales-manager-kpi/evaluations/${evaluationId}/review-demotion`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
