export interface AuthUser {
  id: string;
  phone_number: string;
  role: 'CEO' | 'ROP' | 'EMPLOYEE' | string;
  status: 'Pending' | 'Open' | 'Banned' | 'Deleted' | string;
  first_name?: string;
  last_name?: string;
  name?: string;
  employee_id?: string | null;
  permissions?: any;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  location: string;
  timestamp: string;
  path: string;
  telegram_bot_username?: string;
  telegram_bot_url?: string;
}

export interface Attachment {
  id: string;
  entity_type: 'employee' | 'client' | 'employees' | 'clients';
  entity_id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  entityType?: string;
  entityId?: string;
  fileName?: string;
  filePath?: string;
  mimeType?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

/**
 * Normalizes and formats the backend base URL.
 * Handles inputs like "backend-yaqeen.uz", "https://backend-yaqeen.uz", or "http://localhost:3000/api/v1".
 */
export function formatBaseUrl(raw?: string): string {
  if (!raw || typeof raw !== 'string') {
    return 'http://localhost:3000/api/v1';
  }
  let url = raw.trim();
  if (!url) {
    return 'http://localhost:3000/api/v1';
  }

  // Strip trailing slashes
  url = url.replace(/\/+$/, '');

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    const isLocal = url.startsWith('localhost') || url.startsWith('127.0.0.1');
    url = `${isLocal ? 'http' : 'https'}://${url}`;
  }

  // Append /api/v1 path if no API path exists in the URL
  try {
    const parsed = new URL(url);
    if (parsed.pathname === '' || parsed.pathname === '/') {
      url = `${url}/api/v1`;
    }
  } catch {
    if (!url.includes('/api/')) {
      url = `${url}/api/v1`;
    }
  }

  return url.replace(/\/+$/, '');
}

const envBaseUrl =
  (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ||
  (import.meta.env.BACKEND_BASE_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined);

export const BASE_URL = formatBaseUrl(envBaseUrl);

/**
 * Resolves picture/image URLs (relative or absolute) to a full URL pointing to backend if needed.
 */
export function getImageUrl(path?: string | null): string | undefined {
  if (!path || typeof path !== 'string') return undefined;
  const trimmed = path.trim();
  if (!trimmed) return undefined;

  // Return as-is if already absolute or data/blob URI
  if (/^(https?:\/\/|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  let backendOrigin = 'http://localhost:3000';
  try {
    const parsed = new URL(BASE_URL);
    backendOrigin = parsed.origin;
  } catch {
    // fallback
  }

  if (trimmed.startsWith('/')) {
    return `${backendOrigin}${trimmed}`;
  }

  return `${backendOrigin}/${trimmed}`;
}

// Helper to normalize phone number by stripping all non-digits
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Check if we are running in Demo Mode (disabled)
export function isDemoMode(): boolean {
  return false;
}

export function setDemoMode(_active: boolean) {
  // Demo mode disabled
}

// In-memory token store / LocalStorage sync helpers
export const tokenStore = {
  getAccessToken: (): string | null =>
    localStorage.getItem('yaqeen_access_token') || localStorage.getItem('accessToken'),
  getRefreshToken: (): string | null =>
    localStorage.getItem('yaqeen_refresh_token') || localStorage.getItem('refreshToken'),
  getUser: (): AuthUser | null => {
    const raw = localStorage.getItem('yaqeen_user') || localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  save: (accessToken: string, refreshToken: string, user?: AuthUser) => {
    localStorage.setItem('yaqeen_access_token', accessToken);
    localStorage.setItem('yaqeen_refresh_token', refreshToken);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (user) {
      localStorage.setItem('yaqeen_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
    }
  },
  clear: () => {
    localStorage.removeItem('yaqeen_access_token');
    localStorage.removeItem('yaqeen_refresh_token');
    localStorage.removeItem('yaqeen_user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

export const getAccessToken = tokenStore.getAccessToken;
export const getRefreshToken = tokenStore.getRefreshToken;
export const setTokens = (accessToken: string, refreshToken: string, user?: AuthUser) =>
  tokenStore.save(accessToken, refreshToken, user);
export const clearTokens = tokenStore.clear;

// Helper to create standardized ApiError object
export function makeApiError(
  path: string,
  status: number,
  location: string,
  message: string,
  extras?: Partial<ApiError>
): ApiError {
  return {
    statusCode: status,
    message,
    error:
      status === 401
        ? 'UnauthorizedException'
        : status === 404
          ? 'NotFoundException'
          : 'BadRequestException',
    timestamp: new Date().toISOString(),
    location,
    path,
    ...extras,
  };
}

// State to handle multiple concurrent 401 errors without race conditions
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

export function handleUnauthorizedFailure(errorPayload?: any): ApiError {
  tokenStore.clear();
  window.dispatchEvent(new Event('yaqeen_unauthorized'));
  return (
    errorPayload || {
      statusCode: 401,
      message: 'Session expired. Please log in again.',
      error: 'UnauthorizedException',
      location: 'invalid_refresh_token',
      timestamp: new Date().toISOString(),
      path: '/auth/refresh',
    }
  );
}

export function isAuthBypassPath(path: string): boolean {
  return (
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/admin/login') ||
    path.startsWith('/auth/refresh') ||
    path.startsWith('/auth/logout') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/password-reset') ||
    path.startsWith('/auth/check-telegram-status')
  );
}

// Core fetch engine with interceptor & refresh token rotation queue
export async function fetchWithInterceptors(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenStore.getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  options.headers = headers;

  let response = await fetch(url, options);

  // If 401 Unauthorized, initiate or queue token refresh rotation
  if (response.status === 401 && !isAuthBypassPath(path)) {
    if (isRefreshing) {
      // If a refresh request is already pending, queue this failed request
      const newAccessToken = await new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });

      const retryHeaders = new Headers(options.headers);
      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
      options.headers = retryHeaders;
      return fetch(url, options);
    }

    isRefreshing = true;
    const refreshToken = tokenStore.getRefreshToken();

    if (!refreshToken) {
      const authErr = handleUnauthorizedFailure();
      processQueue(authErr, null);
      isRefreshing = false;
      throw authErr;
    }

    try {
      const refreshUrl = `${BASE_URL}/auth/refresh`;
      const refreshRes = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) {
        let errorBody: any;
        try {
          errorBody = await refreshRes.json();
        } catch {
          errorBody = {
            statusCode: refreshRes.status,
            message: 'Refresh token invalid or expired',
            error: 'UnauthorizedException',
            location: 'invalid_refresh_token',
            timestamp: new Date().toISOString(),
            path: '/auth/refresh',
          };
        }
        const authErr = handleUnauthorizedFailure(errorBody);
        processQueue(authErr, null);
        throw authErr;
      }

      const refreshData: RefreshResponse = await refreshRes.json();
      // Rotate tokens
      tokenStore.save(refreshData.accessToken, refreshData.refreshToken);

      // Resolve queued requests with new token
      processQueue(null, refreshData.accessToken);

      // Retry original request with new token
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set('Authorization', `Bearer ${refreshData.accessToken}`);
      options.headers = retryHeaders;

      response = await fetch(url, options);
    } catch (refreshErr) {
      if (failedQueue.length > 0) {
        processQueue(refreshErr, null);
      }
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}

// Registerable Demo Handlers
export type DemoHandler = (
  path: string,
  options: RequestInit,
  body: any
) => { handled: true; result: any } | null;

const demoHandlers: DemoHandler[] = [];

export function registerDemoHandler(handler: DemoHandler) {
  demoHandlers.push(handler);
}

export async function handleDemoRequest<T>(path: string, options: RequestInit): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulating network lag

  const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : {};

  for (const handler of demoHandlers) {
    const res = handler(path, options, body);
    if (res && res.handled) {
      return res.result as T;
    }
  }

  if (path === '/health') {
    return {
      status: 'ok',
      info: { database: { status: 'up' }, redis: { status: 'up' } },
    } as unknown as T;
  }

  throw makeApiError(path, 404, 'not_found', 'Endpoint not found');
}

// Wrapper for standard JSON fetch requests
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isDemoMode()) {
    return handleDemoRequest<T>(path, options);
  }

  try {
    const response = await fetchWithInterceptors(path, options);

    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        throw makeApiError(path, response.status, 'internal_error', 'Network response was not ok');
      }
      throw errorBody as ApiError;
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      return {} as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  } catch (err: any) {
    // If network connection failed (e.g. backend server at localhost:3000 is offline), fallback to demo mode handler
    if (err instanceof TypeError || err?.name === 'TypeError' || err?.message?.includes('fetch')) {
      console.warn(
        `[API] Backend offline or unreachable at ${path}. Falling back to simulated offline DB mode.`
      );
      return handleDemoRequest<T>(path, options);
    }
    throw err;
  }
}

// Wrapper for DELETE endpoints returning 204 No Content
export async function requestNoContent(path: string, options: RequestInit = {}): Promise<void> {
  if (isDemoMode()) {
    await handleDemoRequest<void>(path, options);
    return;
  }

  try {
    const response = await fetchWithInterceptors(path, options);

    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        throw makeApiError(path, response.status, 'internal_error', 'Request failed');
      }
      throw errorBody as ApiError;
    }
  } catch (err: any) {
    if (err instanceof TypeError || err?.name === 'TypeError' || err?.message?.includes('fetch')) {
      console.warn(
        `[API] Backend offline or unreachable at ${path}. Falling back to simulated offline DB mode.`
      );
      await handleDemoRequest<void>(path, options);
      return;
    }
    throw err;
  }
}
