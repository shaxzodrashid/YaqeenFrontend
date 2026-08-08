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
