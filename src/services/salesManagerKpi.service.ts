import { request, registerDemoHandler } from './httpClient';
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
  CargoMonitoringItem,
  CargoMonitoringMeta,
  CargosMonitoringResponse,
  CargosMonitoringParams,
  UpdateCargoPaymentStatusDto,
  ConfirmCargoKpiDto,
  BulkConfirmKpiDto,
  BulkUpdatePaymentStatusDto,
} from '../types/salesManagerKpi';
import { demoEmployeesDb } from './employees.service';

// ---------------------------------------------------------------------------
// Business Matrix Definitions (For UI calculation reference & tooltips)
// ---------------------------------------------------------------------------

export const SALES_BONUS_MATRIX = [
  { minSales: 0, maxSales: 1999.99, rate: 0, label: '$0 – $1,999.99' },
  { minSales: 2000, maxSales: 3999.99, rate: 10, label: '$2,000 – $3,999.99' },
  { minSales: 4000, maxSales: 5999.99, rate: 15, label: '$4,000 – $5,999.99' },
  { minSales: 6000, maxSales: 7999.99, rate: 20, label: '$6,000 – $7,999.99' },
  { minSales: 8000, maxSales: 9999.99, rate: 22, label: '$8,000 – $9,999.99' },
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

// Helper: Calculate Sales Bonus Rate (%) based on sales volume / net margin sum
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
    employee_first_name: 'Jamshid',
    employee_last_name: 'Rahimov',
    department_name: 'Sales Department',
    mentees_count: 2,
    month: '2026-08',
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
    created_at: '2026-08-01T05:00:00.000Z',
    updated_at: '2026-08-01T05:00:00.000Z',
  },
  {
    id: 'f8821c9b-4763-5d37-9ec8-769c5c85b456',
    employee_id: 'a2c3d4e5-f6a7-8901-bcde-f23456789012', // Alisher Sodikov
    employee_name: 'Alisher Sodikov',
    employee_first_name: 'Alisher',
    employee_last_name: 'Sodikov',
    department_name: 'Sales Department',
    mentees_count: 0,
    month: '2026-08',
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
    created_at: '2026-08-01T04:30:00.000Z',
    updated_at: '2026-08-01T04:30:00.000Z',
  },
  {
    id: 'd4411a7c-2541-3b26-7da6-547a3a63a789',
    employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890', // Madina Karimova
    employee_name: 'Madina Karimova',
    employee_first_name: 'Madina',
    employee_last_name: 'Karimova',
    department_name: 'Sales Department',
    mentees_count: 0,
    month: '2026-08',
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
    created_at: '2026-08-01T03:00:00.000Z',
    updated_at: '2026-08-01T03:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Simulated Demo Store for Assigned Cargos Monitoring (Image 2)
// ---------------------------------------------------------------------------

let demoCargoMonitoringDb: (CargoMonitoringItem & { employee_id: string; month: string })[] = [
  {
    index: 1,
    id: 'cargo-uuid-1',
    employee_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', // Jamshid Rahimov
    month: '2026-08',
    source: 'cargo_registration',
    container_truck_id: '06 KG 762 AJW',
    client_id: 'client-uuid-1',
    client_name: 'Saidjon aka',
    client_company: 'Saidjon MCHJ',
    client_phone: '+998 90 123 45 67',
    buy_price: 9657,
    sell_price: 9950,
    profit: 293,
    payment_deadline_days: 15,
    current_kpi_rate: 25,
    current_kpi_rate_percentage: '25%',
    cargo_bonus: 73.25,
    cargo_bonus_rounded: 73,
    payment_status: 'paid',
    payment_status_label: "To'landi",
    is_paid: true,
    is_kpi_received: true,
    kpi_received_at: '2026-08-15T10:00:00.000Z',
    confirmed_date: '2026-08-01',
    cargo: 'Electronics & Gadgets',
    cargo_type: 'FTL',
  },
  {
    index: 2,
    id: 'cargo-uuid-2',
    employee_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', // Jamshid Rahimov
    month: '2026-08',
    source: 'cargo_registration',
    container_truck_id: '01 543 BBB',
    client_id: 'client-uuid-2',
    client_name: 'Bekzod Fayzullayev',
    client_company: 'Orient Logistics LLC',
    client_phone: '+998 93 555 44 33',
    buy_price: 8200,
    sell_price: 8850,
    profit: 650,
    payment_deadline_days: 10,
    current_kpi_rate: 25,
    current_kpi_rate_percentage: '25%',
    cargo_bonus: 162.5,
    cargo_bonus_rounded: 163,
    payment_status: 'paid',
    payment_status_label: "To'landi",
    is_paid: true,
    is_kpi_received: true,
    kpi_received_at: '2026-08-18T14:30:00.000Z',
    confirmed_date: '2026-08-03',
    cargo: 'Auto Spare Parts',
    cargo_type: 'FTL',
  },
  {
    index: 3,
    id: 'cargo-uuid-3',
    employee_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', // Jamshid Rahimov
    month: '2026-08',
    source: 'cargo_registration',
    container_truck_id: '10 888 AAA',
    client_id: 'client-uuid-3',
    client_name: 'Dilshod Rahmatov',
    client_company: 'Grand Textile Group',
    client_phone: '+998 97 700 11 22',
    buy_price: 11200,
    sell_price: 11950,
    profit: 750,
    payment_deadline_days: 20,
    current_kpi_rate: 25,
    current_kpi_rate_percentage: '25%',
    cargo_bonus: 187.5,
    cargo_bonus_rounded: 188,
    payment_status: 'waiting',
    payment_status_label: 'Kutilmoqda',
    is_paid: false,
    is_kpi_received: false,
    kpi_received_at: null,
    confirmed_date: '2026-08-08',
    cargo: 'Textile Fabric',
    cargo_type: 'FTL',
  },
  {
    index: 4,
    id: 'cargo-uuid-4',
    employee_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', // Jamshid Rahimov
    month: '2026-08',
    source: 'cargo_registration',
    container_truck_id: '01 999 ZZZ',
    client_id: 'client-uuid-4',
    client_name: 'Anvar Temirov',
    client_company: 'Silk Road Trading',
    client_phone: '+998 94 400 33 22',
    buy_price: 7500,
    sell_price: 7920,
    profit: 420,
    payment_deadline_days: 7,
    current_kpi_rate: 25,
    current_kpi_rate_percentage: '25%',
    cargo_bonus: 105.0,
    cargo_bonus_rounded: 105,
    payment_status: 'unpaid',
    payment_status_label: 'Klient bermadi',
    is_paid: false,
    is_kpi_received: false,
    kpi_received_at: null,
    confirmed_date: '2026-08-12',
    cargo: 'Building Materials',
    cargo_type: 'FTL',
  },
  {
    index: 5,
    id: 'cargo-uuid-5',
    employee_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', // Jamshid Rahimov
    month: '2026-08',
    source: 'cargo_registration',
    container_truck_id: '20 123 CCC',
    client_id: 'client-uuid-5',
    client_name: 'Jasur Mirzayev',
    client_company: 'Apex Chem Ltd',
    client_phone: '+998 99 888 77 66',
    buy_price: 14500,
    sell_price: 15480,
    profit: 980,
    payment_deadline_days: 14,
    current_kpi_rate: 25,
    current_kpi_rate_percentage: '25%',
    cargo_bonus: 245.0,
    cargo_bonus_rounded: 245,
    payment_status: 'paid',
    payment_status_label: "To'landi",
    is_paid: true,
    is_kpi_received: false,
    kpi_received_at: null,
    confirmed_date: '2026-08-16',
    cargo: 'Industrial Chemicals',
    cargo_type: 'FTL',
  },
  {
    index: 6,
    id: 'cargo-uuid-6',
    employee_id: 'a2c3d4e5-f6a7-8901-bcde-f23456789012', // Alisher Sodikov
    month: '2026-08',
    source: 'cargo_registration',
    container_truck_id: '01 456 EEE',
    client_id: 'client-uuid-6',
    client_name: 'Nodir Qodirov',
    client_company: 'Master Food Corp',
    client_phone: '+998 90 999 88 77',
    buy_price: 6800,
    sell_price: 7250,
    profit: 450,
    payment_deadline_days: 15,
    current_kpi_rate: 10,
    current_kpi_rate_percentage: '10%',
    cargo_bonus: 45.0,
    cargo_bonus_rounded: 45,
    payment_status: 'paid',
    payment_status_label: "To'landi",
    is_paid: true,
    is_kpi_received: true,
    kpi_received_at: '2026-08-20T11:00:00.000Z',
    confirmed_date: '2026-08-05',
    cargo: 'Food Packaging',
    cargo_type: 'LTL',
  },
  {
    index: 7,
    id: 'cargo-uuid-7',
    employee_id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890', // Madina Karimova
    month: '2026-08',
    source: 'cargo_registration',
    container_truck_id: '40 777 FFF',
    client_id: 'client-uuid-7',
    client_name: 'Zuhra Karimova',
    client_company: 'Moda Style LLC',
    client_phone: '+998 91 222 33 44',
    buy_price: 4500,
    sell_price: 4900,
    profit: 400,
    payment_deadline_days: 10,
    current_kpi_rate: 10,
    current_kpi_rate_percentage: '10%',
    cargo_bonus: 40.0,
    cargo_bonus_rounded: 40,
    payment_status: 'paid',
    payment_status_label: "To'landi",
    is_paid: true,
    is_kpi_received: true,
    kpi_received_at: '2026-08-22T09:00:00.000Z',
    confirmed_date: '2026-08-10',
    cargo: 'Garments & Shoes',
    cargo_type: 'LTL',
  },
];

// Helper to resolve level override string to CareerLevel
function resolveLevelOverride(levelStr?: string): CareerLevel | null {
  if (!levelStr) return null;
  const upper = levelStr.toUpperCase().trim();
  if (upper === 'JUNIOR') return 'JUNIOR';
  if (upper === 'MID' || upper === 'MIDDLE') return 'MID';
  if (upper === 'SENIOR') return 'SENIOR';
  if (upper === 'EXPERT') return 'EXPERT';
  return null;
}

// Helper to generate evaluation object dynamically in demo mode
function createDemoEvaluation(
  emp: any,
  month: string,
  addBonus = 0,
  levelOverride?: CareerLevel | null
): SalesManagerEvaluation {
  const defaultLevel: CareerLevel = (
    emp.user_role === 'ROP' || emp.user_role === 'CEO' ? 'SENIOR' : 'JUNIOR'
  ) as CareerLevel;
  const level: CareerLevel = levelOverride || defaultLevel;
  const spec = CAREER_LEVELS_MATRIX[level] || CAREER_LEVELS_MATRIX.JUNIOR;
  const mentees = level === 'SENIOR' ? 1 : level === 'EXPERT' ? 3 : 0;

  // Simulated sales figures matching tier
  const totalSales =
    level === 'EXPERT' ? 11500 : level === 'SENIOR' ? 7200 : level === 'MID' ? 5500 : 2600;
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
    employee_first_name: emp.first_name || '',
    employee_last_name: emp.last_name || '',
    department_name: emp.department_name || 'Sales Department',
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

  // 1. Calculate Monthly Evaluations (supports level override)
  // POST /sales-manager-kpi/evaluations/calculate or /api/v1/sales-manager-kpi/evaluations/calculate
  if (
    (pathname === '/sales-manager-kpi/evaluations/calculate' ||
      pathname === '/api/v1/sales-manager-kpi/evaluations/calculate') &&
    method === 'POST'
  ) {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const month = body.month || '2026-08';
    const targetEmpId = body.employee_id;
    const addBonus = Number(body.additional_bonus_amount || 0);
    const levelOverride = resolveLevelOverride(body.level);

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

      const newEv = createDemoEvaluation(emp, month, addBonus, levelOverride);
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
  // GET /sales-manager-kpi/evaluations or /api/v1/sales-manager-kpi/evaluations
  if (
    (pathname === '/sales-manager-kpi/evaluations' ||
      pathname === '/api/v1/sales-manager-kpi/evaluations') &&
    method === 'GET'
  ) {
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

  // 3. Get Single Evaluation by ID
  // GET /sales-manager-kpi/evaluations/:id or /api/v1/sales-manager-kpi/evaluations/:id
  const evalByIdMatch = pathname.match(/^(?:\/api\/v1)?\/sales-manager-kpi\/evaluations\/([^/]+)$/);
  if (
    evalByIdMatch &&
    method === 'GET' &&
    !pathname.includes('/calculate') &&
    !pathname.includes('/approve-sr-check') &&
    !pathname.includes('/review-demotion')
  ) {
    const id = evalByIdMatch[1];
    const found = demoEvaluationsDb.find((ev) => ev.id === id);
    if (found) {
      return { handled: true, result: found };
    }
    throw new Error('Evaluation not found');
  }

  // 4. Approve Average Check Exception
  // POST /sales-manager-kpi/evaluations/:id/approve-sr-check
  const approveSrMatch = pathname.match(
    /^(?:\/api\/v1)?\/sales-manager-kpi\/evaluations\/([^/]+)\/approve-sr-check$/
  );
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

  // 5. Review Demotion Escalation
  // POST /sales-manager-kpi/evaluations/:id/review-demotion
  const demotionMatch = pathname.match(
    /^(?:\/api\/v1)?\/sales-manager-kpi\/evaluations\/([^/]+)\/review-demotion$/
  );
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

  // 6. Update Employee Level & Mentees Count
  // PUT /sales-manager-kpi/employee-level/:employeeId
  const levelMatch = pathname.match(/^(?:\/api\/v1)?\/sales-manager-kpi\/employee-level\/([^/]+)$/);
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

  // 7. Cargos Monitoring & KPI (Section 11.4 - Image 2 Table)
  // GET /sales-manager-kpi/cargos-monitoring or /sales-manager-kpi/employee/:employeeId/cargos-monitoring
  const empCargosMatch = pathname.match(
    /^\/sales-manager-kpi\/employee\/([^/]+)\/cargos-monitoring$/
  );
  const baseCargosMatch = pathname === '/sales-manager-kpi/cargos-monitoring';

  if ((baseCargosMatch || empCargosMatch) && method === 'GET') {
    const empIdFromPath = empCargosMatch ? empCargosMatch[1] : undefined;
    const employee_id = empIdFromPath || urlObj.searchParams.get('employee_id');
    const month = urlObj.searchParams.get('month') || '2026-08';
    const payment_status = urlObj.searchParams.get('payment_status') || 'all';
    const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();
    const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
    const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);

    let items = [...demoCargoMonitoringDb];

    if (employee_id) {
      items = items.filter((c) => c.employee_id === employee_id);
    }
    if (month) {
      items = items.filter((c) => c.month === month);
    }
    if (payment_status && payment_status !== 'all') {
      items = items.filter((c) => c.payment_status === payment_status);
    }
    if (search) {
      items = items.filter(
        (c) =>
          c.container_truck_id.toLowerCase().includes(search) ||
          (c.client_name && c.client_name.toLowerCase().includes(search)) ||
          (c.client_company && c.client_company.toLowerCase().includes(search)) ||
          (c.client_phone && c.client_phone.includes(search)) ||
          (c.cargo && c.cargo.toLowerCase().includes(search))
      );
    }

    // Resolve employee info
    const currentEmp = employee_id ? demoEmployeesDb.get(employee_id) : null;
    const empName = currentEmp
      ? `${currentEmp.first_name || ''} ${currentEmp.last_name || ''}`.trim()
      : 'Saidjon Menejer';
    const deptName = currentEmp?.department_name || 'Sales Department';
    const level: CareerLevel = 'EXPERT';
    const spec = CAREER_LEVELS_MATRIX[level];

    // Compute dynamic aggregates across all filtered items for this employee & month
    const allMatching = employee_id
      ? demoCargoMonitoringDb.filter(
          (c) => c.employee_id === employee_id && (!month || c.month === month)
        )
      : demoCargoMonitoringDb.filter((c) => !month || c.month === month);

    const totalCargos = allMatching.length;
    const totalBuyPrice = allMatching.reduce((s, c) => s + (c.buy_price || 0), 0);
    const totalSellPrice = allMatching.reduce((s, c) => s + (c.sell_price || 0), 0);
    const totalProfit = allMatching.reduce((s, c) => s + (c.profit || 0), 0);
    const avgCheck = totalCargos > 0 ? Number((totalProfit / totalCargos).toFixed(2)) : 0;

    const isSrCheckAchieved = avgCheck >= spec.srCheckMin;
    const isPlanAchieved = totalProfit >= spec.targetMin;
    const kpiRate = getSalesBonusRate(totalProfit);

    const paidItems = allMatching.filter((c) => c.payment_status === 'paid');
    const unpaidItems = allMatching.filter((c) => c.payment_status === 'unpaid');
    const waitingItems = allMatching.filter((c) => c.payment_status === 'waiting');
    const kpiConfirmedItems = allMatching.filter((c) => c.is_kpi_received);

    const totalPotentialBonus = allMatching.reduce((s, c) => s + (c.cargo_bonus || 0), 0);
    const totalPaidBonus = paidItems.reduce((s, c) => s + (c.cargo_bonus || 0), 0);
    const totalUnpaidBonus = unpaidItems.reduce((s, c) => s + (c.cargo_bonus || 0), 0);
    const realKpiExpense = totalPaidBonus;
    const fixedSal = spec.fixedSalary;
    const totalEarningsEst = fixedSal + totalPotentialBonus;
    const totalEarningsReal = fixedSal + realKpiExpense;

    const meta: CargoMonitoringMeta = {
      employee_id: employee_id || undefined,
      employee_name: empName,
      department_name: deptName,
      career_level: level,
      month,
      fixed_salary: fixedSal,
      total_cargos: totalCargos,
      total_buy_price: totalBuyPrice,
      total_sell_price: totalSellPrice,
      total_profit: totalProfit,
      average_check: avgCheck,
      sr_check_min: spec.srCheckMin,
      sr_check_target: spec.srCheckTarget,
      is_sr_check_achieved: isSrCheckAchieved,
      is_plan_achieved: isPlanAchieved,
      current_kpi_rate: kpiRate,
      current_kpi_rate_percentage: `${kpiRate}%`,
      total_potential_kpi_bonus: totalPotentialBonus,
      total_paid_kpi_bonus: totalPaidBonus,
      total_unpaid_kpi_bonus: totalUnpaidBonus,
      paid_cargos_count: paidItems.length,
      unpaid_cargos_count: unpaidItems.length,
      waiting_cargos_count: waitingItems.length,
      kpi_confirmed_cargos_count: kpiConfirmedItems.length,
      real_kpi_expense: realKpiExpense,
      total_earnings_estimated: totalEarningsEst,
      total_earnings_realized: totalEarningsReal,
    };

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paginated = items.slice(start, start + limit).map((c, i) => ({
      ...c,
      index: start + i + 1,
    }));

    return {
      handled: true,
      result: {
        meta,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
        data: paginated,
      },
    };
  }

  // 8. Update Single Cargo Payment Status
  // PATCH /sales-manager-kpi/cargos/:id/payment-status
  const payStatusMatch = pathname.match(/^\/sales-manager-kpi\/cargos\/([^/]+)\/payment-status$/);
  if (payStatusMatch && method === 'PATCH') {
    const cargoId = payStatusMatch[1];
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const newStatus = body.payment_status || 'paid';
    const deadlineDays = body.payment_deadline_days;

    const index = demoCargoMonitoringDb.findIndex((c) => c.id === cargoId);
    if (index === -1) {
      throw new Error('Cargo record not found');
    }

    const labels: Record<string, string> = {
      paid: "To'landi",
      waiting: 'Kutilmoqda',
      unpaid: 'Klient bermadi',
    };

    demoCargoMonitoringDb[index] = {
      ...demoCargoMonitoringDb[index],
      payment_status: newStatus,
      payment_status_label: labels[newStatus] || newStatus,
      is_paid: newStatus === 'paid',
      payment_deadline_days:
        deadlineDays !== undefined
          ? Number(deadlineDays)
          : demoCargoMonitoringDb[index].payment_deadline_days,
    };

    return { handled: true, result: demoCargoMonitoringDb[index] };
  }

  // 9. Confirm / Toggle KPI Receipt for Single Cargo
  // PATCH /sales-manager-kpi/cargos/:id/confirm-kpi
  const confirmKpiMatch = pathname.match(/^\/sales-manager-kpi\/cargos\/([^/]+)\/confirm-kpi$/);
  if (confirmKpiMatch && method === 'PATCH') {
    const cargoId = confirmKpiMatch[1];
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const isReceived = Boolean(body.is_kpi_received);

    const index = demoCargoMonitoringDb.findIndex((c) => c.id === cargoId);
    if (index === -1) {
      throw new Error('Cargo record not found');
    }

    demoCargoMonitoringDb[index] = {
      ...demoCargoMonitoringDb[index],
      is_kpi_received: isReceived,
      kpi_received_at: isReceived ? new Date().toISOString() : null,
    };

    return { handled: true, result: demoCargoMonitoringDb[index] };
  }

  // 10. Bulk Confirm KPI Bonus Receipt for Employee Month
  // POST /sales-manager-kpi/bulk-confirm-kpi
  if (pathname === '/sales-manager-kpi/bulk-confirm-kpi' && method === 'POST') {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const { employee_id, month, is_kpi_received } = body;
    let count = 0;

    demoCargoMonitoringDb = demoCargoMonitoringDb.map((c) => {
      if ((!employee_id || c.employee_id === employee_id) && (!month || c.month === month)) {
        count++;
        return {
          ...c,
          is_kpi_received: Boolean(is_kpi_received),
          kpi_received_at: is_kpi_received ? new Date().toISOString() : null,
        };
      }
      return c;
    });

    return {
      handled: true,
      result: {
        message: `Bulk KPI confirmation updated for ${count} cargos`,
        updated_count: count,
      },
    };
  }

  // 11. Bulk Update Payment Status
  // POST /sales-manager-kpi/bulk-payment-status
  if (pathname === '/sales-manager-kpi/bulk-payment-status' && method === 'POST') {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const { cargo_ids = [], payment_status = 'paid' } = body;
    const labels: Record<string, string> = {
      paid: "To'landi",
      waiting: 'Kutilmoqda',
      unpaid: 'Klient bermadi',
    };

    let count = 0;
    demoCargoMonitoringDb = demoCargoMonitoringDb.map((c) => {
      if (cargo_ids.includes(c.id)) {
        count++;
        return {
          ...c,
          payment_status,
          payment_status_label: labels[payment_status] || payment_status,
          is_paid: payment_status === 'paid',
        };
      }
      return c;
    });

    return {
      handled: true,
      result: { message: `Payment status updated for ${count} cargos`, updated_count: count },
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
   * Supports optional `level` override ("Junior", "Middle", "Senior", "Expert").
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
   * Retrieves single evaluation by ID.
   */
  getEvaluationById: (id: string): Promise<SalesManagerEvaluation> =>
    request<SalesManagerEvaluation>(`/sales-manager-kpi/evaluations/${id}`),

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

  /**
   * Retrieves assigned cargos monitoring and KPI summary data (Image 2 table format).
   */
  getCargosMonitoring: (params: CargosMonitoringParams = {}): Promise<CargosMonitoringResponse> => {
    const query = new URLSearchParams();
    if (params.employee_id) query.set('employee_id', params.employee_id);
    if (params.month) query.set('month', params.month);
    if (params.payment_status && params.payment_status !== 'all') {
      query.set('payment_status', params.payment_status);
    }
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return request<CargosMonitoringResponse>(
      `/sales-manager-kpi/cargos-monitoring${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * Retrieves assigned cargos monitoring and KPI summary data for a specific employee.
   */
  getEmployeeCargosMonitoring: (
    employeeId: string,
    params: CargosMonitoringParams = {}
  ): Promise<CargosMonitoringResponse> => {
    const query = new URLSearchParams();
    if (params.month) query.set('month', params.month);
    if (params.payment_status && params.payment_status !== 'all') {
      query.set('payment_status', params.payment_status);
    }
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return request<CargosMonitoringResponse>(
      `/sales-manager-kpi/employee/${employeeId}/cargos-monitoring${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * Updates payment status and deadline for a cargo item.
   */
  updateCargoPaymentStatus: (
    cargoId: string,
    dto: UpdateCargoPaymentStatusDto
  ): Promise<CargoMonitoringItem> =>
    request<CargoMonitoringItem>(`/sales-manager-kpi/cargos/${cargoId}/payment-status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  /**
   * Toggles or records employee confirmation of receiving their KPI bonus for a cargo.
   */
  confirmCargoKpi: (cargoId: string, dto: ConfirmCargoKpiDto): Promise<CargoMonitoringItem> =>
    request<CargoMonitoringItem>(`/sales-manager-kpi/cargos/${cargoId}/confirm-kpi`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  /**
   * Bulk confirms KPI bonus receipt for an employee for a given month.
   */
  bulkConfirmKpi: (dto: BulkConfirmKpiDto): Promise<{ message: string; updated_count: number }> =>
    request<{ message: string; updated_count: number }>('/sales-manager-kpi/bulk-confirm-kpi', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /**
   * Bulk updates payment status for specified cargo IDs.
   */
  bulkUpdatePaymentStatus: (
    dto: BulkUpdatePaymentStatusDto
  ): Promise<{ message: string; updated_count: number }> =>
    request<{ message: string; updated_count: number }>('/sales-manager-kpi/bulk-payment-status', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};
