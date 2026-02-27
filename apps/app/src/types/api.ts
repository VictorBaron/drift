export type ProjectHealth = 'on-track' | 'at-risk' | 'off-track';
export type DriftLevel = 'none' | 'low' | 'high';

export interface ReportContent {
  health: ProjectHealth;
  healthLabel: string;
  progress: number;
  narrative: string;
  decisions: {
    text: string;
    tradeoff: string;
    who: string;
    where: string;
    when: string;
    alignedWithIntent: boolean | 'partial';
  }[];
  drift: {
    level: DriftLevel;
    label: string;
    details: string;
  };
  blockers: {
    text: string;
    owner: string;
    severity: 'high' | 'medium' | 'low';
    since: string;
    impact: string;
  }[];
  keyResults: {
    text: string;
    done: boolean;
  }[];
  threads: {
    title: string;
    participants: string[];
    messages: number;
    outcome: string;
    channel: string;
  }[];
  delivery: {
    merged: number;
    inReview: number;
    blocked: number;
    created: number;
    velocity: string;
    velocityLabel: string;
  };
  sourceCounts: {
    slack: number;
    linear: number;
    notion: number;
  };
}

export interface ReportJSON {
  id: string;
  organizationId: string;
  projectId: string;
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  periodLabel: string;
  content: ReportContent;
  health: ProjectHealth;
  driftLevel: DriftLevel;
  progress: number;
  prevProgress: number;
  slackMessageCount: number;
  linearTicketCount: number;
  notionPagesRead: number;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  generationTimeMs: number;
  generatedAt: string;
  slackDeliveredAt: string | null;
  slackMessageTs: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectJSON {
  id: string;
  name: string;
  emoji: string;
  organizationId: string;
  pmLeadName: string | null;
  techLeadName: string | null;
  teamName: string | null;
  targetDate: string | null;
  weekNumber: number;
  slackChannelIds: string[];
  linearProjectId: string | null;
  linearTeamId: string | null;
  notionPageId: string | null;
  productObjective: string | null;
  objectiveOrigin: string | null;
  keyResults: { text: string; done: boolean }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthMeResponse {
  member: {
    id: string;
    email: string;
    name: string;
    slackUserId: string;
    avatarUrl: string | null;
    role: 'admin' | 'member';
    organizationId: string;
  };
  organization: {
    id: string;
    name: string;
    slackTeamId: string;
    hasLinear: boolean;
  };
}
