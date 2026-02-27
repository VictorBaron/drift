import type { AuthMeResponse, ProjectJSON, ReportJSON } from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getMe: () => request<AuthMeResponse>('/auth/me'),

  getLatestReports: () => request<ReportJSON[]>('/reports/latest'),

  getReport: (reportId: string) => request<ReportJSON>(`/reports/${reportId}`),

  getProjects: () => request<ProjectJSON[]>('/projects'),

  generateReport: (projectId: string) => request<ReportJSON>(`/reports/generate/${projectId}`, { method: 'POST' }),
};
