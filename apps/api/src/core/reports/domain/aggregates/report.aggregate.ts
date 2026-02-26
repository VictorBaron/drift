import { AggregateRoot, type AggregateRootProps } from 'common/domain';

export type ProjectHealth = 'on-track' | 'at-risk' | 'off-track';
export type DriftLevel = 'none' | 'low' | 'high';

export interface ReportContent {
  health: 'on-track' | 'at-risk' | 'off-track';
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
    level: 'none' | 'low' | 'high';
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

interface ReportProps extends AggregateRootProps {
  projectId: string;
  weekStart: Date;
  weekEnd: Date;
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
  generatedAt: Date;
  slackDeliveredAt: Date | null;
  slackMessageTs: string | null;
}

export interface ReportJSON {
  id: string;
  projectId: string;
  weekStart: Date;
  weekEnd: Date;
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
  generatedAt: Date;
  slackDeliveredAt: Date | null;
  slackMessageTs: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface GenerateReportProps {
  projectId: string;
  weekStart: Date;
  weekEnd: Date;
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
}

export class Report extends AggregateRoot {
  private projectId: string;
  private weekStart: Date;
  private weekEnd: Date;
  private weekNumber: number;
  private periodLabel: string;
  private content: ReportContent;
  private health: ProjectHealth;
  private driftLevel: DriftLevel;
  private progress: number;
  private prevProgress: number;
  private slackMessageCount: number;
  private linearTicketCount: number;
  private notionPagesRead: number;
  private modelUsed: string;
  private promptTokens: number;
  private completionTokens: number;
  private generationTimeMs: number;
  private generatedAt: Date;
  private slackDeliveredAt: Date | null;
  private slackMessageTs: string | null;

  private constructor(props: ReportProps) {
    super(props);
    this.projectId = props.projectId;
    this.weekStart = props.weekStart;
    this.weekEnd = props.weekEnd;
    this.weekNumber = props.weekNumber;
    this.periodLabel = props.periodLabel;
    this.content = props.content;
    this.health = props.health;
    this.driftLevel = props.driftLevel;
    this.progress = props.progress;
    this.prevProgress = props.prevProgress;
    this.slackMessageCount = props.slackMessageCount;
    this.linearTicketCount = props.linearTicketCount;
    this.notionPagesRead = props.notionPagesRead;
    this.modelUsed = props.modelUsed;
    this.promptTokens = props.promptTokens;
    this.completionTokens = props.completionTokens;
    this.generationTimeMs = props.generationTimeMs;
    this.generatedAt = props.generatedAt;
    this.slackDeliveredAt = props.slackDeliveredAt;
    this.slackMessageTs = props.slackMessageTs;
  }

  static generate(props: GenerateReportProps): Report {
    const now = new Date();
    return new Report({
      id: crypto.randomUUID(),
      ...props,
      generatedAt: now,
      slackDeliveredAt: null,
      slackMessageTs: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: ReportProps): Report {
    return new Report(props);
  }

  getProjectId(): string {
    return this.projectId;
  }

  getWeekStart(): Date {
    return this.weekStart;
  }

  getHealth(): ProjectHealth {
    return this.health;
  }

  getDriftLevel(): DriftLevel {
    return this.driftLevel;
  }

  getProgress(): number {
    return this.progress;
  }

  getContent(): ReportContent {
    return this.content;
  }

  markDelivered(messageTs: string): void {
    this.slackDeliveredAt = new Date();
    this.slackMessageTs = messageTs;
    this.updatedAt = new Date();
  }

  toJSON(): ReportJSON {
    return {
      id: this.id,
      projectId: this.projectId,
      weekStart: this.weekStart,
      weekEnd: this.weekEnd,
      weekNumber: this.weekNumber,
      periodLabel: this.periodLabel,
      content: this.content,
      health: this.health,
      driftLevel: this.driftLevel,
      progress: this.progress,
      prevProgress: this.prevProgress,
      slackMessageCount: this.slackMessageCount,
      linearTicketCount: this.linearTicketCount,
      notionPagesRead: this.notionPagesRead,
      modelUsed: this.modelUsed,
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      generationTimeMs: this.generationTimeMs,
      generatedAt: this.generatedAt,
      slackDeliveredAt: this.slackDeliveredAt,
      slackMessageTs: this.slackMessageTs,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
