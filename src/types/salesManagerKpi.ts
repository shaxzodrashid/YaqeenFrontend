export type CareerLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'EXPERT';

export type EvaluationApprovalStatus =
  | 'APPROVED'
  | 'PENDING_SR_CHECK_APPROVAL'
  | 'DEMOTION_PENDING_REVIEW'
  | 'DEMOTION_APPROVED'
  | 'DEMOTION_REJECTED';

export type DemotionReviewAction = 'APPROVE_DEMOTION' | 'MAINTAIN_LEVEL';

export interface SalesManagerEvaluation {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_first_name?: string;
  employee_last_name?: string;
  department_name?: string;
  mentees_count?: number;
  month: string; // YYYY-MM
  career_level: CareerLevel;
  fixed_salary: string | number;
  total_sales: string | number;
  deal_count: number;
  average_check: string | number;
  plan_target_min: string | number;
  plan_target_max: string | number;
  sr_check_min: string | number;
  sr_check_target: string | number;
  is_plan_achieved: boolean;
  is_sr_check_achieved: boolean;
  sales_bonus_rate: string | number;
  sales_bonus_amount: string | number;
  kpi_bonus_amount: string | number;
  additional_bonus_amount: string | number;
  total_earnings: string | number;
  consecutive_successes: number;
  consecutive_failures: number;
  approval_status: EvaluationApprovalStatus;
  reviewed_by?: string | null;
  reviewer_name?: string | null;
  review_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CalculateEvaluationDto {
  month: string;
  employee_id?: string;
  additional_bonus_amount?: number;
  level?: string; // Optional override: "Junior", "Middle" / "Mid", "Senior", "Expert"
}

export interface CalculateEvaluationResponse {
  month: string;
  evaluations_calculated: number;
  evaluations: SalesManagerEvaluation[];
}

export interface ListEvaluationsParams {
  month?: string;
  employee_id?: string;
  approval_status?: EvaluationApprovalStatus | string;
  page?: number;
  limit?: number;
}

export interface ListEvaluationsResponse {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: SalesManagerEvaluation[];
}

export interface ApproveSrCheckDto {
  review_notes?: string;
}

export interface ReviewDemotionDto {
  action: DemotionReviewAction;
  review_notes?: string;
}

export interface UpdateCareerLevelDto {
  career_level: CareerLevel;
  mentees_count: number;
}

// ---------------------------------------------------------------------------
// Employee Assigned Cargos Monitoring & KPI Types (Section 11.4 & 11.5)
// ---------------------------------------------------------------------------

export type CargoPaymentStatus = 'waiting' | 'unpaid' | 'paid' | 'all';

export interface CargoMonitoringItem {
  index: number;
  id: string;
  source: string;
  container_truck_id: string;
  client_id?: string;
  client_name?: string;
  client_company?: string;
  client_phone?: string;
  buy_price: number;
  sell_price: number;
  profit: number;
  payment_deadline_days?: number;
  current_kpi_rate: number;
  current_kpi_rate_percentage: string;
  cargo_bonus: number;
  cargo_bonus_rounded: number;
  payment_status: 'waiting' | 'unpaid' | 'paid';
  payment_status_label: string;
  is_paid: boolean;
  is_kpi_received: boolean;
  kpi_received_at?: string | null;
  confirmed_date: string;
  cargo?: string;
  cargo_type?: string;
}

export interface CargoMonitoringMeta {
  employee_id?: string;
  employee_name?: string;
  department_name?: string;
  career_level?: CareerLevel | string;
  month: string;
  fixed_salary: number;
  total_cargos: number;
  total_buy_price: number;
  total_sell_price: number;
  total_profit: number;
  average_check: number;
  sr_check_min: number;
  sr_check_target: number;
  is_sr_check_achieved: boolean;
  is_plan_achieved: boolean;
  current_kpi_rate: number;
  current_kpi_rate_percentage: string;
  total_potential_kpi_bonus: number;
  total_paid_kpi_bonus: number;
  total_unpaid_kpi_bonus: number;
  paid_cargos_count: number;
  unpaid_cargos_count: number;
  waiting_cargos_count: number;
  kpi_confirmed_cargos_count: number;
  real_kpi_expense: number;
  total_earnings_estimated: number;
  total_earnings_realized: number;
}

export interface CargoMonitoringPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CargosMonitoringResponse {
  meta: CargoMonitoringMeta;
  pagination: CargoMonitoringPagination;
  data: CargoMonitoringItem[];
}

export interface CargosMonitoringParams {
  employee_id?: string;
  month?: string;
  payment_status?: CargoPaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateCargoPaymentStatusDto {
  payment_status: 'waiting' | 'unpaid' | 'paid';
  payment_deadline_days?: number;
}

export interface ConfirmCargoKpiDto {
  is_kpi_received: boolean;
  review_notes?: string;
}

export interface BulkConfirmKpiDto {
  employee_id: string;
  month: string;
  is_kpi_received: boolean;
}

export interface BulkUpdatePaymentStatusDto {
  cargo_ids: string[];
  payment_status: 'waiting' | 'unpaid' | 'paid';
}
