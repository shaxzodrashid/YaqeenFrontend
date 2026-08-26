import { request, requestNoContent } from './httpClient';
import type { SupportedCurrency, CbuRateItem } from '../types/currency';

export type ExpenseCategory =
  'tax' | 'utility' | 'rent' | 'salary_payout' | 'cleaner' | 'kpi' | 'food' | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  currency?: SupportedCurrency;
  employee_id?: string;
  description: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseDto {
  category: ExpenseCategory;
  amount: number;
  currency?: SupportedCurrency;
  employee_id?: string;
  description: string;
  expense_date: string;
}

export interface UpdateExpenseDto {
  category?: ExpenseCategory;
  amount?: number;
  currency?: SupportedCurrency;
  employee_id?: string;
  description?: string;
  expense_date?: string;
}

export interface ExpenseListParams {
  category?: string;
  employee_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

export interface ExpensePaginatedResponse {
  data: Expense[];
  total_sum: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  label: string;
  description: string;
  total_amount: number;
  expense_count: number;
}

export interface CategoryBreakdownResponse {
  period_start: string;
  period_end: string;
  grand_total: number;
  categories: CategoryBreakdownItem[];
}

export interface FinanceSummaryMetrics {
  gross_revenue: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  gross_margin?: number;
  operational_expenses: number;
  fixed_salaries_expense: number;
  kpi_bonuses_expense: number;
  total_payroll_expense: number;
  total_expenses: number;
  total_all_in_expenses?: number;
  net_profit: number;
  seo_cut_10pc: number;
  seo_pure_profit_share?: number;
}

export interface FinanceFlowExpenseItem {
  amount: number;
  percentage: number;
}

export interface FinanceFlowDiagram {
  formula: string;
  gross_margin: number;
  total_all_in_expenses: number;
  net_profit: number;
  all_in_expense_breakdown: {
    total: number;
    operational_expenses: FinanceFlowExpenseItem;
    salaries: FinanceFlowExpenseItem;
    kpi_bonuses: FinanceFlowExpenseItem;
  };
}

export interface ExpenseDistributionItem {
  category: ExpenseCategory;
  label: string;
  description: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface PreviousPeriodSummary {
  start_date: string;
  end_date: string;
  gross_revenue?: number;
  cost_of_goods_sold?: number;
  gross_profit: number;
  operational_expenses?: number;
  fixed_salaries_expense?: number;
  kpi_bonuses_expense?: number;
  total_expenses: number;
  net_profit: number;
}

export interface FinancePeriodComparison {
  previous_period?: PreviousPeriodSummary;
  net_profit_change_amount: number;
  net_profit_growth_percentage: number;
  expenses_change_amount: number;
  expenses_change_percentage: number;
  gross_profit_change_amount?: number;
  gross_profit_growth_percentage?: number;
}

export interface FinanceSummaryResponse {
  currency?: SupportedCurrency;
  normalized_currency_label?: string;
  period: {
    start_date: string;
    end_date: string;
  };
  cbu_rates?: Record<string, CbuRateItem>;
  summary: FinanceSummaryMetrics;
  flow_diagram?: FinanceFlowDiagram;
  expense_distribution?: ExpenseDistributionItem[];
  expense_breakdown: Partial<Record<ExpenseCategory, number>>;
  comparison: FinancePeriodComparison;
}

export interface EmployeeSalaryInfo {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone: string;
  department_id?: string;
  department_name?: string;
  fixed_salary: number;
  currency?: SupportedCurrency;
  is_active: boolean;
  color?: string;
}

export interface DepartmentSalaryGroup {
  department_id: string;
  department_name: string;
  employee_count: number;
  total_fixed_salary: number;
  employees: EmployeeSalaryInfo[];
}

export interface FixedSalariesResponse {
  total_employees: number;
  total_active_employees: number;
  currency?: SupportedCurrency;
  total_monthly_salaries: number;
  departments: DepartmentSalaryGroup[];
}

export interface UpdateEmployeeSalaryDto {
  fixed_salary: number;
  currency?: SupportedCurrency;
}

export interface BatchUpdateSalaryItem {
  employee_id: string;
  fixed_salary: number;
  currency?: SupportedCurrency;
}

export interface BatchUpdateSalariesDto {
  salaries: BatchUpdateSalaryItem[];
}

export const financeApi = {
  // A. Summary & Analytics
  getSummary: (params?: {
    period?: string;
    start_date?: string;
    end_date?: string;
    currency?: SupportedCurrency;
  }) => {
    const q = new URLSearchParams();
    if (params?.period) q.set('period', params.period);
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    if (params?.currency) q.set('currency', params.currency);
    const queryString = q.toString();
    return request<FinanceSummaryResponse>(
      `/finance/summary${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
      }
    );
  },

  // B. Expense Management (CRUD)
  createExpense: (data: CreateExpenseDto) =>
    request<Expense>('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listExpenses: (params?: ExpenseListParams) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.employee_id) q.set('employee_id', params.employee_id);
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.sort_by) q.set('sort_by', params.sort_by);
    if (params?.order) q.set('order', params.order);
    const queryString = q.toString();
    return request<ExpensePaginatedResponse>(
      `/finance/expenses${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
      }
    );
  },

  getCategoryBreakdown: (params?: { period?: string; start_date?: string; end_date?: string }) => {
    const q = new URLSearchParams();
    if (params?.period) q.set('period', params.period);
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    const queryString = q.toString();
    return request<CategoryBreakdownResponse>(
      `/finance/expenses/categories${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  getExpenseById: (id: string) =>
    request<Expense>(`/finance/expenses/${id}`, {
      method: 'GET',
    }),

  updateExpense: (id: string, data: UpdateExpenseDto) =>
    request<Expense>(`/finance/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteExpense: (id: string) =>
    requestNoContent(`/finance/expenses/${id}`, {
      method: 'DELETE',
    }),

  // C. Fixed Salary Management
  getFixedSalaries: (department_id?: string) => {
    const q = new URLSearchParams();
    if (department_id) q.set('department_id', department_id);
    const queryString = q.toString();
    return request<FixedSalariesResponse>(
      `/finance/salaries${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
      }
    );
  },

  updateEmployeeSalary: (employee_id: string, data: number | UpdateEmployeeSalaryDto) => {
    const payload = typeof data === 'number' ? { fixed_salary: data } : data;
    return request<EmployeeSalaryInfo>(`/finance/salaries/${employee_id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  batchUpdateSalaries: (dto: BatchUpdateSalariesDto) =>
    request<FixedSalariesResponse>('/finance/salaries', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
};
