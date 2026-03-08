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

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WindTurbine {
  id: string;
  name: string;
  farmId: string;
  status: string;
  lastSeen: string;
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

export interface TurbineStatusDto {
  turbine: WindTurbine;
  latestMetric: TurbineMetric | null;
}

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
  getCommands: (id: string) => apiGet<TurbineCommand[]>(`/api/turbines/${id}/commands`),
  sendCommand: (id: string, action: string, params?: Record<string, unknown>) =>
    apiPost<TurbineCommand>(`/api/turbines/${id}/commands`, { action, ...params }),
};

// ─── Alerts API ──────────────────────────────────────────────────────────────

export const alertsApi = {
  getAll: (includeAcknowledged = false) =>
    apiGet<TurbineAlert[]>(`/api/alerts?includeAcknowledged=${includeAcknowledged}`),
  acknowledge: (id: string) => apiPatch<TurbineAlert>(`/api/alerts/${id}/acknowledge`),
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