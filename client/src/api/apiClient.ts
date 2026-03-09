const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5233';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let message = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(text);
      message = json.detail || json.error || json.title || text || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getHeaders() });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WindTurbine {
  id: string;
  name: string;
  farmId: string;
  status: string;
  lastSeen: string;
  telemetryIntervalSeconds: number;
}

export interface TurbineMetric {
  id: string;
  turbineId: string;
  farmId: string;
  timestamp: string;
  windSpeed: number;
  windDirection: number;
  ambientTemperature: number;
  rotorSpeed: number;
  powerOutput: number;
  nacelleDirection: number;
  bladePitch: number;
  generatorTemp: number;
  gearboxTemp: number;
  vibration: number;
  status: string;
}

export interface TurbineAlert {
  id: string;
  turbineId: string;
  farmId: string;
  timestamp: string;
  severity: string;
  message: string;
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
}

export interface TurbineCommand {
  id: string;
  turbineId: string;
  farmId: string;
  userId: string;
  userName: string;
  action: string;
  payload: string;
  timestamp: string;
}

export interface MetricHistoryPoint {
  period: string;
  windSpeed: number;
  powerOutput: number;
  rotorSpeed: number;
  bladePitch: number;
  generatorTemp: number;
  gearboxTemp: number;
  vibration: number;
  ambientTemperature: number;
  dataPoints: number;
}

export interface TurbineStatusDto {
  turbine: WindTurbine;
  latestMetric: TurbineMetric | null;
}

// ─── Info API ────────────────────────────────────────────────────────────────

export const farmApi = {
  get: () => apiGet<{ farmId: string }>('/api/farm'),
};

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiPost<{ token: string }>('/api/auth/Login', { email, password }),
  register: (name: string, email: string, password: string, confirmPassword: string) =>
    apiPost<{ name: string }>('/api/auth/Register', { name, email, password, confirmPassword }),
};

// ─── Turbines API ────────────────────────────────────────────────────────────

export const turbinesApi = {
  getAll: () => apiGet<TurbineStatusDto[]>('/api/turbines'),
  getById: (id: string) => apiGet<TurbineStatusDto>(`/api/turbines/${id}`),
  getMetrics: (id: string, limit = 50) =>
    apiGet<TurbineMetric[]>(`/api/turbines/${id}/metrics?limit=${limit}`),
  getCommands: (id: string, page = 1, pageSize = 20) =>
    apiGet<CommandsPage>(`/api/turbines/${id}/commands?page=${page}&pageSize=${pageSize}`),
  getMetricsHistory: (id: string, from?: string, to?: string, granularity = 'day') => {
    const params = new URLSearchParams({ granularity });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiGet<MetricHistoryPoint[]>(`/api/turbines/${id}/metrics/history?${params}`);
  },
  sendCommand: (id: string, action: string, params?: Record<string, unknown>) =>
    apiPost<TurbineCommand>(`/api/turbines/${id}/commands`, { action, ...params }),
};

// ─── Commands API ────────────────────────────────────────────────────────────

export interface CommandsPage {
  total: number;
  page: number;
  pageSize: number;
  items: TurbineCommand[];
}

export const commandsApi = {
  getAll: (params?: { from?: string; to?: string; turbineId?: string; userName?: string; page?: number; pageSize?: number }) => {
    const p = new URLSearchParams();
    if (params?.from) p.set('from', params.from);
    if (params?.to) p.set('to', params.to);
    if (params?.turbineId) p.set('turbineId', params.turbineId);
    if (params?.userName) p.set('userName', params.userName);
    if (params?.page) p.set('page', String(params.page));
    if (params?.pageSize) p.set('pageSize', String(params.pageSize));
    const qs = p.toString();
    return apiGet<CommandsPage>(`/api/commands${qs ? `?${qs}` : ''}`);
  },
};

// ─── Alerts API ──────────────────────────────────────────────────────────────

export const alertsApi = {
  getAll: (includeAcknowledged = false) =>
    apiGet<TurbineAlert[]>(`/api/alerts?includeAcknowledged=${includeAcknowledged}`),
  acknowledge: (id: string) => apiPatch<TurbineAlert>(`/api/alerts/${id}/acknowledge`),
  triggerTest: (turbineId: string) => apiPost<TurbineAlert>(`/api/alerts/test?turbineId=${turbineId}`),
};

// ─── Users API ───────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UsersPage {
  total: number;
  page: number;
  pageSize: number;
  items: AppUser[];
}

export const usersApi = {
  getAll: (params?: { page?: number; pageSize?: number; search?: string }) => {
    const p = new URLSearchParams();
    if (params?.page) p.set('page', String(params.page));
    if (params?.pageSize) p.set('pageSize', String(params.pageSize));
    if (params?.search) p.set('search', params.search);
    const qs = p.toString();
    return apiGet<UsersPage>(`/api/users${qs ? `?${qs}` : ''}`);
  },
};

// ─── Alert Thresholds API ─────────────────────────────────────────────────────

export interface AlertThreshold {
  id: string;
  metricName: string;
  value: number;
  severity: string;
  description: string;
  isEnabled: boolean;
}

export const alertThresholdsApi = {
  getAll: () => apiGet<AlertThreshold[]>('/api/alert-thresholds'),
  update: (id: string, body: { value?: number; isEnabled?: boolean; description?: string }) =>
    apiPut<AlertThreshold>(`/api/alert-thresholds/${id}`, body),
};

// ─── Maintenance API ──────────────────────────────────────────────────────────

export interface MaintenancePeriod {
  turbineId: string;
  turbineName: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  triggeredBy: string;
  resumedBy: string | null;
}

export interface MaintenancePage {
  total: number;
  page: number;
  pageSize: number;
  items: MaintenancePeriod[];
}

export const maintenanceApi = {
  getAll: (params?: { page?: number; pageSize?: number; turbineId?: string }) => {
    const p = new URLSearchParams();
    if (params?.page) p.set('page', String(params.page));
    if (params?.pageSize) p.set('pageSize', String(params.pageSize));
    if (params?.turbineId) p.set('turbineId', params.turbineId);
    const qs = p.toString();
    return apiGet<MaintenancePage>(`/api/maintenance${qs ? `?${qs}` : ''}`);
  },
};

// ─── Profile API ──────────────────────────────────────────────────────────────

export const profileApi = {
  update: (body: { name?: string; currentPassword?: string; newPassword?: string }) =>
    apiPut<{ id: string; name: string; email: string }>('/api/auth/profile', body),
};

// ─── Realtime API (SSE subscriptions) ───────────────────────────────────────

export const realtimeApi = {
  getTurbines: (connectionId: string) =>
    apiGet<{ group: string; data: TurbineStatusDto[] }>(`/GetTurbines?connectionId=${connectionId}`),
  getTurbineAlerts: (connectionId: string) =>
    apiGet<{ group: string; data: TurbineAlert[] }>(`/GetTurbineAlerts?connectionId=${connectionId}`),
  getTurbineMetrics: (connectionId: string, turbineId: string) =>
    apiGet<{ group: string; data: TurbineMetric[] }>(
      `/GetTurbineMetrics?connectionId=${connectionId}&turbineId=${turbineId}`
    ),
};