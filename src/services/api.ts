// Re-export all types & interfaces
export type {
  SupportedCurrency,
  CbuRateItem,
  ExchangeRatesResponse,
  ConvertCurrencyRequest,
  ConvertCurrencyResponse,
  SyncRatesResponse,
} from '../types/currency';
export { formatMoney } from '../types/currency';

export type {
  AuthUser,
  LoginResponse,
  RefreshResponse,
  ApiError,
  Attachment,
  PaginatedResponse,
} from './httpClient';

export type { CheckTelegramStatusResponse } from './auth.service';
export { TELEGRAM_BOT_USERNAME, getTelegramBotUrl, demoAuthDb } from './auth.service';

export type {
  Department,
  CreateDepartmentDto,
  Employee,
  EmployeeListItem,
  EmployeeListMeta,
  EmployeeListResponse,
  EmployeeTotalRevenue,
  EmployeePlanCompletion,
  EmployeeTushum,
  KPIStatusCode,
  EmployeeRejaFakt,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeListParams,
} from './employees.service';

export type {
  Client,
  CreateClientDto,
  UpdateClientDto,
  ClientColorStats,
  ClientListParams,
  ClientPaginatedResponse,
} from './clients.service';

export type {
  LtlCalculateDto,
  LtlCalculateResult,
  LtlCargoType,
  LtlCargoItem,
  LtlEmployeeSummary,
  LtlItemsResponse,
  CreateLtlItemDto,
  UpdateLtlItemDto,
  FtlTruckItem,
  FtlManagerSummary,
  FtlSummaryResponse,
  CreateFtlItemDto,
  UpdateFtlItemDto,
  RopWorkerShare,
  RopSummaryResponse,
  SeoCalculateDto,
  SeoCalculateResult,
  EmployeeLtlPlan,
  EmployeeFtlPlan,
  EmployeePlanProgress,
  EmployeePlansResponse,
  CreateEmployeePlanDto,
  UpdateEmployeePlanDto,
  PlansDepartmentBreakdown,
  PlansAggregatedStatsResponse,
  EmployeePersonalPlanStatsResponse,
  CargoTransaction,
  CargoTransactionListParams,
  CargoTransactionPaginatedResponse,
  CreateCargoTransactionDto,
  ResponseMeta,
  ViewableStatusGroupMetrics,
  ViewableStatusGroup,
  ViewableTransactionsResponse,
} from './cargoKpi.service';

export type {
  ExpenseCategory,
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseListParams,
  ExpensePaginatedResponse,
  CategoryBreakdownItem,
  CategoryBreakdownResponse,
  FinanceSummaryMetrics,
  FinanceFlowExpenseItem,
  FinanceFlowDiagram,
  ExpenseDistributionItem,
  PreviousPeriodSummary,
  FinancePeriodComparison,
  FinanceSummaryResponse,
  EmployeeSalaryInfo,
  DepartmentSalaryGroup,
  FixedSalariesResponse,
  UpdateEmployeeSalaryDto,
  BatchUpdateSalaryItem,
  BatchUpdateSalariesDto,
} from './finance.service';

export type {
  Role,
  SystemModule,
  ModulePermissions,
  ClientsModulePermissions,
  CargoConsolidationsModulePermissions,
  RolePermissions,
  CreateRoleDto,
  UpdateRoleDto,
} from './roles.service';

export type {
  TaskPriority,
  TaskAssignee,
  TaskChecklist,
  TaskComment,
  TaskActivityLog,
  TaskAttachment,
  Task,
  KanbanColumn,
  KanbanBoard,
  CreateBoardDto,
  UpdateBoardDto,
  CreateColumnDto,
  UpdateColumnDto,
  ReorderColumnsDto,
  CreateTaskDto,
  UpdateTaskDto,
  MoveTaskDto,
  TaskListParams,
  TaskListResponse,
  ViewableColumnMetrics,
  ViewableColumnGroup,
  ViewableTasksResponse,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  CreateCommentDto,
} from './tasks.service';

export type {
  CommercialOfferStatus,
  CommercialOffer,
  CreateCommercialOfferDto,
  UpdateCommercialOfferDto,
  UpdateOfferStatusDto,
  QueryCommercialOfferDto,
  CommercialOfferStats,
  CommercialOfferPaginatedResponse,
} from '../types/commercialOffers';

export type {
  CargoType,
  ContainerType,
  TransportType,
  CargoRegistrationStatus,
  CurrencyType,
  CreateCargoRegistrationDto,
  UpdateCargoRegistrationDto,
  CargoRegistrationListParams,
  CargoRegistrationStatsParams,
  CargoRegistrationsStatsResponse,
  CargoRegistrationPriceAmount,
  CargoRegistrationNetYield,
  CargoRegistrationListItem,
  CargoRegistrationMeta,
  CargoRegistrationPaginatedResponse,
  CargoRegistrationDetail,
} from './cargoRegistrations.service';
export {
  CONTAINER_TYPES,
  TRANSPORT_TYPES,
  TRANSPORT_TYPE_LABELS,
  CARGO_STATUSES,
  convertPriceToUsdAndUzs,
} from './cargoRegistrations.service';

export type {
  ConsolidationStatus,
  ConsolidationContainerType,
  ConsolidationCapacity,
  ConsolidationFinancials,
  ConsolidationCargoItem,
  ConsolidationListItem,
  ConsolidationActiveDropdownItem,
  CreateConsolidationDto,
  UpdateConsolidationDto,
  ConsolidationListParams,
  ConsolidationMeta,
  ConsolidationPaginatedResponse,
} from './cargoConsolidations.service';
export {
  CONSOLIDATION_STATUSES,
  CONSOLIDATION_CONTAINER_TYPES,
  cargoConsolidationsApi,
} from './cargoConsolidations.service';

// Re-export core HTTP & Token helpers
export {
  BASE_URL,
  getImageUrl,
  normalizePhone,
  isDemoMode,
  setDemoMode,
  tokenStore,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  fetchWithInterceptors,
  request,
  requestNoContent,
} from './httpClient';

// Re-export service API objects
export { authApi } from './auth.service';
export { departmentsApi, employeesApi } from './employees.service';
export { attachmentsApi } from './attachments.service';
export { clientsApi } from './clients.service';
export { cargoKpiApi } from './cargoKpi.service';
export { cargoRegistrationsApi } from './cargoRegistrations.service';
export { cargoConsolidationsApi as consolidationsApi } from './cargoConsolidations.service';
export { financeApi } from './finance.service';
export { currencyApi, CurrencyApiClient } from './currency.service';
export { rolesApi } from './roles.service';
export { tasksService } from './tasks.service';
export { commercialOffersApi } from './commercialOffers.service';

export type {
  CityOption,
  RouteInfo,
  LocationDetail,
  CitySearchParams,
  DuplicateCheckDto,
  DuplicateCheckResult,
} from '../types/locations';

export {
  locationsApi,
  POPULAR_LOGISTICS_HUBS,
  getCountryFlag,
  buildGoogleMapsPointUrl,
  buildGoogleMapsRouteUrl,
} from './locations.service';

export type {
  DashboardPeriod,
  DashboardGranularity,
  DashboardTransportType,
  DashboardFilterParams,
  DashboardMonthlyYearlyBlock,
  DashboardSalesProgressMeta,
  DashboardSalesProgressSummary,
  DashboardSalesProgressDataPoint,
  DashboardSalesProgressResponse,
  DashboardSummaryResponse,
  TransportTypeDistributionItem,
  CargoTypeDistributionItem,
  StatusDistributionItem,
  DashboardCargoDistributionResponse,
  TopManagerItem,
  TopClientItem,
  DashboardTopPerformersResponse,
  RouteAnalyticsItem,
  OriginCountryItem,
  DashboardRouteAnalyticsResponse,
  DeliveryStatusBreakdownItem,
  RouteTransitTimeItem,
  DashboardDeliveryEfficiencyResponse,
  DebtorClientItem,
  CreditorCarrierItem,
  DashboardDebtSummaryResponse,
} from '../types/dashboard';

export { dashboardApi } from './dashboard.service';

import { request } from './httpClient';
import { authApi } from './auth.service';
import { departmentsApi, employeesApi } from './employees.service';
import { attachmentsApi } from './attachments.service';
import { clientsApi } from './clients.service';
import { cargoKpiApi } from './cargoKpi.service';
import { cargoRegistrationsApi } from './cargoRegistrations.service';
import { cargoConsolidationsApi } from './cargoConsolidations.service';
import { financeApi } from './finance.service';
import { currencyApi } from './currency.service';
import { rolesApi } from './roles.service';
import { tasksService } from './tasks.service';
import { commercialOffersApi } from './commercialOffers.service';
import { dashboardApi } from './dashboard.service';
import { locationsApi } from './locations.service';

// Global API object for complete backward compatibility
export const api = {
  ...authApi,
  checkHealth: () => request<{ status: string }>('/health', { method: 'GET' }),
  departments: departmentsApi,
  employees: employeesApi,
  attachments: attachmentsApi,
  clients: clientsApi,
  cargoKpi: cargoKpiApi,
  cargoRegistrations: cargoRegistrationsApi,
  cargoConsolidations: cargoConsolidationsApi,
  consolidations: cargoConsolidationsApi,
  locations: locationsApi,
  finance: financeApi,
  currency: currencyApi,
  roles: rolesApi,
  tasks: tasksService,
  kanban: tasksService,
  commercialOffers: commercialOffersApi,
  dashboard: dashboardApi,
};
