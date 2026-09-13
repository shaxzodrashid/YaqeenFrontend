/**
 * Yaqeen Frontend - Shipping Agents & Carriers Type Definitions
 * Specification matches AGENTS_API_DOC.md
 */

export interface Agent {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name?: string;
  phone_number: string | null;
  email: string | null;
  company_name: string | null;
  company_names: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_cargos_count?: number;
  active_cargos_count?: number;
  total_payable_amount?: number;
}

export interface AgentDropdownItem {
  id: string;
  display_name: string;
  name?: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name: string | null;
  phone_number: string | null;
}

export type AgentSortField =
  | 'created_at'
  | 'first_name'
  | 'last_name'
  | 'company_name'
  | 'total_cargos_count'
  | 'active_cargos_count'
  | 'total_payable_amount';

export type AgentSortOrder = 'asc' | 'desc';

export interface AgentListParams {
  page?: number;
  limit?: number;
  q?: string;
  is_active?: boolean;
  sort_by?: AgentSortField;
  sort_order?: AgentSortOrder;
}

export interface AgentPaginatedResponse {
  data: Agent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateAgentDto {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  company_name?: string;
  company_names?: string[];
  notes?: string;
}

export interface UpdateAgentDto extends Partial<CreateAgentDto> {
  is_active?: boolean;
}

export interface DeleteAgentResponse {
  success: boolean;
  message?: string;
  deactivated?: boolean;
}
