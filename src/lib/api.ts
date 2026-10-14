import type {
  InviteCode,
  Payment,
  Property,
  Repair,
  Session,
  Tenant,
  Unit,
} from '../types';

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) || '/api/v1').replace(/\/$/, '');
const KEY = 'mn_session';

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    return;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function messageFrom(body: any, fallback: string) {
  const detail = body?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e: any) => `${(e.loc || []).slice(1).join('.')}: ${e.msg}`).join('; ');
  }
  return fallback;
}

let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  const current = loadSession();
  if (!current) return Promise.resolve(false);
  if (!refreshing) {
    refreshing = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        saveSession((await res.json()) as Session);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

interface Init {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, init: Init = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  const session = loadSession();
  if (init.auth !== false && session) headers.Authorization = `Bearer ${session.access_token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method || 'GET',
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 401 && init.auth !== false && session && !retried) {
    if (await refreshSession()) return request<T>(path, init, true);
    saveSession(null);
    window.dispatchEvent(new Event('mn:logout'));
  }

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw new ApiError(res.status, messageFrom(body, `Request failed (${res.status})`));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body });
const put = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body });
const del = (path: string) => request<void>(path, { method: 'DELETE' });

export const api = {
  login: (email: string, password: string) =>
    request<Session>('/auth/login-json', { method: 'POST', body: { email, password }, auth: false }),
  register: (body: { email: string; password: string; full_name: string; phone: string; invite_code: string }) =>
    request<Session>('/auth/register', { method: 'POST', body, auth: false }),

  properties: () => request<Property[]>('/properties'),
  createProperty: (body: { name: string; address: string; owner: string; description: string }) =>
    post<Property>('/properties', body),
  updateProperty: (id: number, body: Partial<Property>) => put<Property>(`/properties/${id}`, body),
  deleteProperty: (id: number) => del(`/properties/${id}`),

  units: () => request<Unit[]>('/units'),
  createUnit: (body: {
    property_id: number;
    unit_number: string;
    rent_amount: number;
    status: string;
    floor?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
  }) => post<Unit>('/units', body),
  updateUnit: (id: number, body: Partial<Unit>) => put<Unit>(`/units/${id}`, body),
  deleteUnit: (id: number) => del(`/units/${id}`),

  tenants: () => request<Tenant[]>('/tenants'),
  myTenant: () => request<Tenant>('/tenants/me'),
  createTenant: (body: {
    unit_id: number;
    name: string;
    contact_info: string;
    email: string;
    password: string;
    lease_start: string;
    lease_end: string;
    national_id?: string | null;
  }) => post<Tenant>('/tenants', body),
  deleteTenant: (id: number) => del(`/tenants/${id}`),

  payments: () => request<Payment[]>('/payments'),
  createPayment: (body: {
    tenant_id: number;
    amount: number;
    due_date: string;
    status?: string;
    notes?: string | null;
  }) => post<Payment>('/payments', body),
  updatePayment: (id: number, body: Partial<Payment>) => put<Payment>(`/payments/${id}`, body),

  repairs: () => request<Repair[]>('/maintenance'),
  createRepair: (body: { title: string; description: string; category: string; priority: string }) =>
    post<Repair>('/maintenance', body),
  updateRepair: (id: number, body: Partial<Repair>) => put<Repair>(`/maintenance/${id}`, body),

  inviteCodes: () => request<InviteCode[]>('/invite-codes'),
  createInvite: (body: { unit_id: number; lease_start?: string; lease_end?: string }) =>
    post<InviteCode>('/invite-codes', body),
  revokeInvite: (id: number) => del(`/invite-codes/${id}`),
};
