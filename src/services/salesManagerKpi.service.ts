import {
  request,
  registerDemoHandler,
} from './httpClient';
import type {
  SalesManagerEvaluation,
  CalculateEvaluationDto,
  CalculateEvaluationResponse,
  ListEvaluationsParams,
  ListEvaluationsResponse,
  ApproveSrCheckDto,
  ReviewDemotionDto,
  UpdateCareerLevelDto,
  CareerLevel,
  EvaluationApprovalStatus,
} from '../types/salesManagerKpi';
import { demoEmployeesDb } from './employees.service';

// ---------------------------------------------------------------------------
// Business Matrix Definitions (For UI calculation reference & tooltips)
// ---------------------------------------------------------------------------

export const SALES_BONUS_MATRIX = [
  { minSales: 0, maxSales: 1999, rate: 0, label: '$0 – $1,999' },
  { minSales: 2000, maxSales: 3999, rate: 10, label: '$2,000 – $3,999' },
  { minSales: 4000, maxSales: 5999, rate: 15, label: '$4,000 – $5,999' },
  { minSales: 6000, maxSales: 7999, rate: 20, label: '$6,000 – $7,999' },
  { minSales: 8000, maxSales: 9999, rate: 22, label: '$8,000 – $9,999' },
  { minSales: 10000, maxSales: Infinity, rate: 25, label: '≥ $10,000' },
];

export interface CareerLevelSpec {
  level: CareerLevel;
  fixedSalary: number;
  targetMin: number;
  targetMax: number;
  srCheckMin: number;
  srCheckTarget: number;
  menteesRequired: number;
  promotionRule: string;
  demotionEscalation: string;
}

export const CAREER_LEVELS_MATRIX: Record<CareerLevel, CareerLevelSpec> = {
  JUNIOR: {
    level: 'JUNIOR',
    fixedSalary: 300,
    targetMin: 0,
    targetMax: 3000,
    srCheckMin: 150,
    srCheckTarget: 300,
    menteesRequired: 0,
    promotionRule: '2 consecutive success months',
    demotionEscalation: 'Base level',
  },
  MID: {
    level: 'MID',
    fixedSalary: 500,
    targetMin: 5000,
    targetMax: 6000,
    srCheckMin: 200,
    srCheckTarget: 400,
    menteesRequired: 0,
    promotionRule: '3 consecutive success months',
    demotionEscalation: '2 consecutive missed plan months',
  },
  SENIOR: {
    level: 'SENIOR',
    fixedSalary: 700,
    targetMin: 6001,
    targetMax: 8000,
    srCheckMin: 250,
    srCheckTarget: 500,
    menteesRequired: 1,
    promotionRule: '4 consecutive success months',
    demotionEscalation: '2 consecutive missed plan months',
  },
  EXPERT: {
    level: 'EXPERT',
    fixedSalary: 1000,
    targetMin: 8001,
    targetMax: 10000,
    srCheckMin: 300,
    srCheckTarget: 600,
    menteesRequired: 3,
    promotionRule: 'Top tier',
    demotionEscalation: '3 consecutive missed plan months',
  },
};

// Helper: Calculate Sales Bonus Rate (%) based on sales volume
export function getSalesBonusRate(sales: number): number {
  for (const tier of SALES_BONUS_MATRIX) {
    if (sales >= tier.minSales && sales <= tier.maxSales) {
      return tier.rate;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Simulated Demo Store for Sales Manager Evaluations
// ---------------------------------------------------------------------------

let demoEvaluationsDb: SalesManagerEvaluation[] = [
  {
    id: 'e6741b8a-3652-4c26-8db7-658b4b74a123',
    employee_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', // Jamshid Rahimov
    employee_name: 'Jamshid Rahimov',
    mentees_count: 2,
    month: '2026-07',
    career_level: 'SENIOR',
    fixed_salary: '700.00',
    total_sales: '7200.00',
    deal_count: 16,
    average_check: '450.00',
    plan_target_min: '6001.00',
    plan_target_max: '8000.00',
    sr_check_min: '250.00',
    sr_check_target: '500.00',
    is_plan_achieved: true,
    is_sr_check_achieved: false,
    sales_bonus_rate: '20.00',
    sales_bonus_amount: '1440.00',
    kpi_bonus_amount: '360.00',
    additional_bonus_amount: '0.00',
    total_earnings: '2500.00',
    consecutive_successes: 1,
    consecutive_failures: 0,
    approval_status: 'PENDING_SR_CHECK_APPROVAL',
    reviewed_by: null,
    reviewer_name: null,
    review_notes: null,
    created_at: '2026-07-30T05:00:00.000Z',
    updated_at: '2026-07-30T05:00:00.000Z',
  },
  {
    id: 'f8821c9b-4763-5d37-9ec8-769c5c85b456',
    employee_id: 'a2c3d4e5-f6a7-8901-bcde-f23456789012', // Alisher Sodikov
    employee_name: 'Alisher Sodikov',
    mentees_count: 0,
    month: '2026-07',
    career_level: 'MID',
    fixed_salary: '500.00',
    total_sales: '3200.00',
    deal_count: 8,
    average_check: '400.00',
    plan_target_min: '5000.00',
    plan_target_max: '6000.00',
    sr_check_min: '200.00',
    sr_check_target: '400.00',
    is_plan_achieved: false,
    is_sr_check_achieved: true,
    sales_bonus_rate: '10.00',
    sales_bonus_amount: '320.00',
    kpi_bonus_amount: '0.00',
    additional_bonus_amount: '0.00',
    total_earnings: '820.00',
    consecutive_successes: 0,
    consecutive_failures: 2,
    approval_status: 'DEMOTION_PENDING_REVIEW',
    reviewed_by: null,
    reviewer_name: null,
    review_notes: null,
    created_at: '2026-07-30T04:30:00.000Z',
    updated_at: '2026-07-30T04:30:00.000Z',
  },
  {
    id: 'd4411a7c-2541-3b26-7da6-547a3a63a789',
    employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890', // Madina Karimova
    employee_name: 'Madina Karimova',
    mentees_count: 0,
    month: '2026-07',
    career_level: 'JUNIOR',
    fixed_salary: '300.00',
    total_sales: '2500.00',
    deal_count: 10,
    average_check: '250.00',
    plan_target_min: '0.00',
    plan_target_max: '3000.00',
    sr_check_min: '150.00',
    sr_check_target: '300.00',
    is_plan_achieved: true,
    is_sr_check_achieved: true,
    sales_bonus_rate: '10.00',
    sales_bonus_amount: '250.00',
    kpi_bonus_amount: '125.00',
    additional_bonus_amount: '50.00',
    total_earnings: '725.00',
    consecutive_successes: 2,
    consecutive_failures: 0,
    approval_status: 'APPROVED',
    reviewed_by: 'system',
    reviewer_name: 'System Auto-Approval',
    review_notes: 'Calculated and approved',
    created_at: '2026-07-30T03:00:00.000Z',
    updated_at: '2026-07-30T03:00:00.000Z',
  },
];

// Helper to generate evaluation object dynamically in demo mode
function createDemoEvaluation(
  emp: any,
  month: string,
  addBonus = 0
): SalesManagerEvaluation {
  const level: CareerLevel = (emp.user_role === 'ROP' || emp.user_role === 'CEO' ? 'SENIOR' : 'JUNIOR') as CareerLevel;
  const spec = CAREER_LEVELS_MATRIX[level] || CAREER_LEVELS_MATRIX.JUNIOR;
  const mentees = level === 'SENIOR' ? 1 : level === 'EXPERT' ? 3 : 0;

  // Simulated sales figures
  const totalSales = level === 'EXPERT' ? 11500 : level === 'SENIOR' ? 7200 : 2600;
  const dealCount = Math.floor(totalSales / 400) || 6;
  const avgCheck = Number((totalSales / dealCount).toFixed(2));
  const isPlanAchieved = totalSales >= spec.targetMin;
  const isSrAchieved = avgCheck >= spec.srCheckTarget;
  const isSrMinAchieved = avgCheck >= spec.srCheckMin;

  const bonusRate = getSalesBonusRate(totalSales);
  const salesBonus = Number(((totalSales * bonusRate) / 100).toFixed(2));
  const kpiBonus = isPlanAchieved ? Number((salesBonus * 0.25).toFixed(2)) : 0;
  const totalEarnings = Number((spec.fixedSalary + salesBonus + kpiBonus + addBonus).toFixed(2));

  let status: EvaluationApprovalStatus = 'APPROVED';
  if (isPlanAchieved && !isSrAchieved && !isSrMinAchieved) {
    status = 'PENDING_SR_CHECK_APPROVAL';
  }

  const name = emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : 'Sales Manager';

  return {
    id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    employee_id: emp.id,
    employee_name: name,
    mentees_count: mentees,
    month,
    career_level: level,
    fixed_salary: spec.fixedSalary.toFixed(2),
    total_sales: totalSales.toFixed(2),
    deal_count: dealCount,
    average_check: avgCheck.toFixed(2),
    plan_target_min: spec.targetMin.toFixed(2),
    plan_target_max: spec.targetMax.toFixed(2),
    sr_check_min: spec.srCheckMin.toFixed(2),
    sr_check_target: spec.srCheckTarget.toFixed(2),
    is_plan_achieved: isPlanAchieved,
    is_sr_check_achieved: isSrAchieved,
    sales_bonus_rate: bonusRate.toFixed(2),
    sales_bonus_amount: salesBonus.toFixed(2),
    kpi_bonus_amount: kpiBonus.toFixed(2),
    additional_bonus_amount: addBonus.toFixed(2),
    total_earnings: totalEarnings.toFixed(2),
    consecutive_successes: isPlanAchieved ? 1 : 0,
    consecutive_failures: isPlanAchieved ? 0 : 1,
    approval_status: status,
    reviewed_by: status === 'APPROVED' ? 'system' : null,
    reviewer_name: status === 'APPROVED' ? 'System Auto-Approval' : null,
    review_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Register Offline/Demo Handlers
// ---------------------------------------------------------------------------

registerDemoHandler((path, options) => {
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(`http://dummy${path}`);
  const pathname = urlObj.pathname;
  const allEmployees = Array.from(demoEmployeesDb.values());

  // 1. Calculate Monthly Evaluations
  // POST /sales-manager-kpi/evaluations/calculate
  if (pathname === '/sales-manager-kpi/evaluations/calculate' && method === 'POST') {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const month = body.month || '2026-07';
    const targetEmpId = body.employee_id;
    const addBonus = Number(body.additional_bonus_amount || 0);

    let employeesToCalc = allEmployees;
    if (targetEmpId) {
      employeesToCalc = allEmployees.filter((e) => e.id === targetEmpId);
    }

    const calculated: SalesManagerEvaluation[] = [];

    for (const emp of employeesToCalc) {
      // Remove previous evaluation if exists for month
      demoEvaluationsDb = demoEvaluationsDb.filter(
        (ev) => !(ev.employee_id === emp.id && ev.month === month)
      );

      const newEv = createDemoEvaluation(emp, month, addBonus);
      demoEvaluationsDb.unshift(newEv);
      calculated.push(newEv);
    }

    return {
      handled: true,
      result: {
        month,
        evaluations_calculated: calculated.length,
        evaluations: calculated,
      },
    };
  }

  // 2. List Evaluations
  // GET /sales-manager-kpi/evaluations
  if (pathname === '/sales-manager-kpi/evaluations' && method === 'GET') {
    const month = urlObj.searchParams.get('month');
    const employee_id = urlObj.searchParams.get('employee_id');
    const approval_status = urlObj.searchParams.get('approval_status');
    const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10);

    let filtered = [...demoEvaluationsDb];
    if (month) {
      filtered = filtered.filter((item) => item.month === month);
    }
    if (employee_id) {
      filtered = filtered.filter((item) => item.employee_id === employee_id);
    }
    if (approval_status) {
      filtered = filtered.filter((item) => item.approval_status === approval_status);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      handled: true,
      result: {
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
        data: paginated,
      },
    };
  }

  // 3. Approve Average Check Exception
  // POST /sales-manager-kpi/evaluations/:id/approve-sr-check
  const approveSrMatch = pathname.match(/^\/sales-manager-kpi\/evaluations\/([^/]+)\/approve-sr-check$/);
  if (approveSrMatch && method === 'POST') {
    const id = approveSrMatch[1];
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const notes = body.review_notes || 'Approved by Manager';

    const index = demoEvaluationsDb.findIndex((ev) => ev.id === id);
    if (index === -1) {
      throw new Error('Evaluation record not found');
    }

    demoEvaluationsDb[index] = {
      ...demoEvaluationsDb[index],
      approval_status: 'APPROVED',
      reviewer_name: 'ROP / CEO Reviewer',
      review_notes: notes,
      updated_at: new Date().toISOString(),
    };

    return { handled: true, result: demoEvaluationsDb[index] };
  }

  // 4. Review Demotion Escalation
  // POST /sales-manager-kpi/evaluations/:id/review-demotion
  const demotionMatch = pathname.match(/^\/sales-manager-kpi\/evaluations\/([^/]+)\/review-demotion$/);
  if (demotionMatch && method === 'POST') {
    const id = demotionMatch[1];
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const action: 'APPROVE_DEMOTION' | 'MAINTAIN_LEVEL' = body.action || 'MAINTAIN_LEVEL';
    const notes = body.review_notes || '';

    const index = demoEvaluationsDb.findIndex((ev) => ev.id === id);
    if (index === -1) {
      throw new Error('Evaluation record not found');
    }

    const currentEv = demoEvaluationsDb[index];

    if (action === 'APPROVE_DEMOTION') {
      const levels: CareerLevel[] = ['JUNIOR', 'MID', 'SENIOR', 'EXPERT'];
      const curIndex = levels.indexOf(currentEv.career_level);
      const newLevel = curIndex > 0 ? levels[curIndex - 1] : 'JUNIOR';

      demoEvaluationsDb[index] = {
        ...currentEv,
        career_level: newLevel,
        consecutive_failures: 0,
        approval_status: 'DEMOTION_APPROVED',
        reviewer_name: 'ROP / CEO Reviewer',
        review_notes: notes,
        updated_at: new Date().toISOString(),
      };
    } else {
      demoEvaluationsDb[index] = {
        ...currentEv,
        approval_status: 'DEMOTION_REJECTED',
        reviewer_name: 'ROP / CEO Reviewer',
        review_notes: notes,
        updated_at: new Date().toISOString(),
      };
    }

    return { handled: true, result: demoEvaluationsDb[index] };
  }

  // 5. Update Employee Level & Mentees Count
  // PUT /sales-manager-kpi/employee-level/:employeeId
  const levelMatch = pathname.match(/^\/sales-manager-kpi\/employee-level\/([^/]+)$/);
  if (levelMatch && method === 'PUT') {
    const employeeId = levelMatch[1];
    const body = options.body ? JSON.parse(String(options.body)) : {};

    // Update in demo evaluations DB
    demoEvaluationsDb = demoEvaluationsDb.map((ev) => {
      if (ev.employee_id === employeeId) {
        return {
          ...ev,
          career_level: body.career_level || ev.career_level,
          mentees_count: body.mentees_count !== undefined ? body.mentees_count : ev.mentees_count,
        };
      }
      return ev;
    });

    return {
      handled: true,
      result: { message: 'Employee career level and mentees updated successfully' },
    };
  }

  return null;
});

// ---------------------------------------------------------------------------
// Sales Manager KPI API Service Methods
// ---------------------------------------------------------------------------

export const salesManagerKpiApi = {
  /**
   * Triggers evaluation calculation for all or single employee for a given month.
   */
  calculateEvaluations: (dto: CalculateEvaluationDto): Promise<CalculateEvaluationResponse> =>
    request<CalculateEvaluationResponse>('/sales-manager-kpi/evaluations/calculate', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /**
   * Retrieves list of sales manager evaluations with pagination and filters.
   */
  getEvaluations: (params: ListEvaluationsParams = {}): Promise<ListEvaluationsResponse> => {
    const query = new URLSearchParams();
    if (params.month) query.set('month', params.month);
    if (params.employee_id) query.set('employee_id', params.employee_id);
    if (params.approval_status) query.set('approval_status', params.approval_status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return request<ListEvaluationsResponse>(`/sales-manager-kpi/evaluations${qs ? `?${qs}` : ''}`);
  },

  /**
   * ROP / CEO action to approve Average Check exception.
   */
  approveSrCheck: (id: string, dto: ApproveSrCheckDto = {}): Promise<SalesManagerEvaluation> =>
    request<SalesManagerEvaluation>(`/sales-manager-kpi/evaluations/${id}/approve-sr-check`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /**
   * ROP / CEO action to review demotion escalation.
   */
  reviewDemotion: (id: string, dto: ReviewDemotionDto): Promise<SalesManagerEvaluation> =>
    request<SalesManagerEvaluation>(`/sales-manager-kpi/evaluations/${id}/review-demotion`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /**
   * Direct management endpoint to adjust an employee's career rank or trained mentee count.
   */
  updateEmployeeLevel: (
    employeeId: string,
    dto: UpdateCareerLevelDto
  ): Promise<{ message: string }> =>
    request<{ message: string }>(`/sales-manager-kpi/employee-level/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
};
