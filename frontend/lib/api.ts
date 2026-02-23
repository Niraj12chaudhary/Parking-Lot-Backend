import { Ticket } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Unexpected API failure',
    }));
    throw new Error(error.message ?? 'Unexpected API failure');
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (payload: { username: string; password: string }) =>
    request<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createEntry: (token: string, payload: Record<string, unknown>) =>
    request<Ticket>('/parking/entry', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),
  createExit: (token: string, payload: Record<string, unknown>) =>
    request<{ ticket: Ticket; payment: { amount: number; method: string } }>(
      '/parking/exit',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
      },
    ),
  dashboardMetrics: (token: string) =>
    request<{
      activeTickets: number;
      occupancyRate: number;
      updatedAt: string;
    }>('/parking/reports/dashboard-metrics', { token }),
  revenueSummary: (token: string) =>
    request<{
      totalRevenue: number;
      totalPayments: number;
      trend: Array<{ bucket: string; revenue: number; payments: number }>;
    }>('/parking/reports/revenue-summary', { token }),
  occupancyRate: (token: string) =>
    request<{
      totalSpots: number;
      occupiedSpots: number;
      occupancyRate: number;
      floorBreakdown: Array<{
        floorId: number;
        floorNumber: number;
        totalSpots: number;
        occupiedSpots: number;
        occupancyRate: number;
      }>;
    }>('/parking/reports/occupancy-rate', { token }),
  activeTickets: (token: string) =>
    request<{ data: Ticket[]; total: number; page: number; limit: number }>(
      '/parking/reports/active-tickets',
      { token },
    ),
  spots: (token: string) => request('/parking/spots', { token }),
  floors: (token: string) => request('/parking/floors', { token }),
  historicalAnalytics: (token: string) =>
    request<Array<{ bucket: string; entries: number; completed: number }>>(
      '/parking/reports/historical-analytics?granularity=day',
      { token },
    ),
  peakHours: (token: string) =>
    request<Array<{ hour: number; entries: number }>>('/parking/reports/peak-hours', {
      token,
    }),
};
