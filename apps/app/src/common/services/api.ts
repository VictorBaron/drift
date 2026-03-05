import type { AuthMeResponse, ProjectJSON, ReportJSON } from '@/common/types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const SESSION_KEY = 'drift_session';

export function storeSessionToken(token: string) {
  sessionStorage.setItem(SESSION_KEY, token);
}

function getSessionToken(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers,
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  isMember: boolean;
}

export interface LinearProject {
  id: string;
  name: string;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
  projects: LinearProject[];
}

export interface LinearTeamsResponse {
  connected: boolean;
  teams: LinearTeam[];
}

export interface NotionPagePreview {
  title: string | null;
  pageId?: string;
}

export interface ExtractObjectiveResult {
  productObjective: string | null;
  keyResults: { text: string; done: boolean }[];
}

export interface UpdateProjectSourcesPayload {
  slackChannelIds: string[];
  linearTeamId?: string | null;
  linearProjectId?: string | null;
  notionPageId?: string | null;
}

export interface CreateProjectPayload {
  name: string;
  emoji: string;
  pmLeadName?: string | null;
  techLeadName?: string | null;
  teamName?: string | null;
  targetDate?: string | null;
  slackChannelIds?: string[];
  linearProjectId?: string | null;
  linearTeamId?: string | null;
  notionPageId?: string | null;
  productObjective?: string | null;
  objectiveOrigin?: string | null;
  keyResults?: { text: string; done: boolean }[];
}

export const api = {
  getMe: () => request<AuthMeResponse>('/auth/me'),

  getLatestReports: () => request<ReportJSON[]>('/reports/latest'),

  getReport: (reportId: string) => request<ReportJSON>(`/reports/${reportId}`),

  getProjects: () => request<ProjectJSON[]>('/projects'),

  generateReport: (projectId: string) => request<ReportJSON>(`/reports/generate/${projectId}`, { method: 'POST' }),

  getSlackChannels: () => request<SlackChannel[]>('/projects/channels'),

  getLinearTeams: () => request<LinearTeamsResponse>('/integrations/linear/teams'),

  getNotionPagePreview: (pageId: string) =>
    request<NotionPagePreview>(`/integrations/notion/page-preview?pageId=${encodeURIComponent(pageId)}`),

  extractObjective: (pageId: string) =>
    request<ExtractObjectiveResult>('/integrations/notion/extract-objective', {
      method: 'POST',
      body: JSON.stringify({ pageId }),
    }),

  createProject: (payload: CreateProjectPayload) =>
    request<ProjectJSON>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProjectSources: (projectId: string, payload: UpdateProjectSourcesPayload) =>
    request<void>(`/projects/${projectId}/sources`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
