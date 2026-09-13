import type { CareerLevel } from './salesManagerKpi';

export type DecisionType = 'PROMOTION' | 'DEMOTION' | 'SR_CHECK' | 'KPI';
export type DecisionAction = 'APPROVE' | 'REJECT' | 'MAINTAIN';

export interface KpiAlertPeriod {
  start_date: string;
  end_date: string;
  last_week_start: string;
  current_day: number;
  total_days: number;
  days_remaining: number;
}

export interface KpiAlertSummary {
  total_employees: number;
  total_kpi_bonus: number;
  pending_decisions_count: number;
  promotions_count: number;
  demotions_count: number;
  sr_check_approvals_count: number;
}

export interface KpiAlertMetrics {
  total_sales: number;
  deal_count: number;
  average_check: number;
  plan_target_min: number;
  plan_target_max: number;
  sales_bonus_amount: number;
  total_earnings: number;
  is_plan_achieved: boolean;
  is_sr_check_achieved: boolean;
}

export interface KpiAlertSuggestion {
  alert_id: string;
  evaluation_id: string;
  employee_id: string;
  employee_name: string;
  department_name: string;
  phone: string;
  decision_type: DecisionType;
  current_level: CareerLevel;
  suggested_level: CareerLevel;
  current_salary: number;
  suggested_salary: number;
  approval_status: string;
  consecutive_successes: number;
  consecutive_failures: number;
  mentees_count: number;
  mentees_required: number;
  metrics: KpiAlertMetrics;
}

export interface KpiEmployeeEvaluation {
  evaluation_id: string;
  employee_id: string;
  employee_name: string;
  department_name: string;
  career_level: CareerLevel;
  fixed_salary: number;
  total_sales: number;
  deal_count: number;
  average_check: number;
  plan_target_min: number;
  plan_target_max: number;
  plan_progress_percentage: number;
  is_plan_achieved: boolean;
  is_sr_check_achieved: boolean;
  sales_bonus_amount: number;
  paid_sales_bonus_amount: number;
  unpaid_sales_bonus_amount: number;
  additional_bonus_amount: number;
  total_earnings: number;
  consecutive_successes: number;
  consecutive_failures: number;
  approval_status: string;
  reviewed_by?: string | null;
  review_notes?: string | null;
}

export interface KpiAlertPopupResponse {
  month: string;
  is_last_week: boolean;
  should_popup: boolean;
  period: KpiAlertPeriod;
  summary: KpiAlertSummary;
  suggestions: KpiAlertSuggestion[];
  employees_kpi: KpiEmployeeEvaluation[];
}

export interface KpiDecisionDto {
  evaluation_id?: string;
  alert_id?: string;
  decision_type: DecisionType;
  action: DecisionAction;
  update_salary?: boolean;
  new_salary?: number;
  review_notes?: string;
}

export interface BulkKpiDecisionDto {
  month: string;
  update_salaries?: boolean;
  decisions: KpiDecisionDto[];
}

export interface BulkDecisionResponse {
  total_requested: number;
  successful_count: number;
  failed_count: number;
  results: any[];
  errors: any[];
}

export interface ReviewPromotionDedicatedDto {
  action: 'APPROVE_PROMOTION' | 'REJECT_PROMOTION';
  update_salary?: boolean;
  new_salary?: number;
  review_notes?: string;
}

export interface ReviewDemotionDedicatedDto {
  action: 'APPROVE_DEMOTION' | 'MAINTAIN_LEVEL';
  update_salary?: boolean;
  new_salary?: number;
  review_notes?: string;
}
