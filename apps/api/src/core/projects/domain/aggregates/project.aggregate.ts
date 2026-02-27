import { AggregateRoot, type AggregateRootProps } from 'common/domain';

export interface KeyResult {
  text: string;
  done: boolean;
}

interface ProjectProps extends AggregateRootProps {
  name: string;
  emoji: string;
  organizationId: string;
  pmLeadName: string | null;
  techLeadName: string | null;
  teamName: string | null;
  targetDate: Date | null;
  weekNumber: number;
  slackChannelIds: string[];
  linearProjectId: string | null;
  linearTeamId: string | null;
  notionPageId: string | null;
  productObjective: string | null;
  objectiveOrigin: string | null;
  keyResults: KeyResult[];
  isActive: boolean;
}

export interface ProjectJSON {
  id: string;
  name: string;
  emoji: string;
  organizationId: string;
  pmLeadName: string | null;
  techLeadName: string | null;
  teamName: string | null;
  targetDate: Date | null;
  weekNumber: number;
  slackChannelIds: string[];
  linearProjectId: string | null;
  linearTeamId: string | null;
  notionPageId: string | null;
  productObjective: string | null;
  objectiveOrigin: string | null;
  keyResults: KeyResult[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateProjectProps {
  name: string;
  emoji: string;
  organizationId: string;
  pmLeadName?: string | null;
  techLeadName?: string | null;
  teamName?: string | null;
  targetDate?: Date | null;
  weekNumber?: number;
}

export class Project extends AggregateRoot {
  private name: string;
  private emoji: string;
  private organizationId: string;
  private pmLeadName: string | null;
  private techLeadName: string | null;
  private teamName: string | null;
  private targetDate: Date | null;
  private weekNumber: number;
  private slackChannelIds: string[];
  private linearProjectId: string | null;
  private linearTeamId: string | null;
  private notionPageId: string | null;
  private productObjective: string | null;
  private objectiveOrigin: string | null;
  private keyResults: KeyResult[];
  private isActive: boolean;

  private constructor(props: ProjectProps) {
    super(props);
    this.name = props.name;
    this.emoji = props.emoji;
    this.organizationId = props.organizationId;
    this.pmLeadName = props.pmLeadName;
    this.techLeadName = props.techLeadName;
    this.teamName = props.teamName;
    this.targetDate = props.targetDate;
    this.weekNumber = props.weekNumber;
    this.slackChannelIds = props.slackChannelIds;
    this.linearProjectId = props.linearProjectId;
    this.linearTeamId = props.linearTeamId;
    this.notionPageId = props.notionPageId;
    this.productObjective = props.productObjective;
    this.objectiveOrigin = props.objectiveOrigin;
    this.keyResults = props.keyResults;
    this.isActive = props.isActive;
  }

  static create(props: CreateProjectProps): Project {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber =
      props.weekNumber ?? Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));

    return new Project({
      id: crypto.randomUUID(),
      name: props.name,
      emoji: props.emoji,
      organizationId: props.organizationId,
      pmLeadName: props.pmLeadName ?? null,
      techLeadName: props.techLeadName ?? null,
      teamName: props.teamName ?? null,
      targetDate: props.targetDate ?? null,
      weekNumber,
      slackChannelIds: [],
      linearProjectId: null,
      linearTeamId: null,
      notionPageId: null,
      productObjective: null,
      objectiveOrigin: null,
      keyResults: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: ProjectProps): Project {
    return new Project(props);
  }

  getName(): string {
    return this.name;
  }

  getEmoji(): string {
    return this.emoji;
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getSlackChannelIds(): string[] {
    return this.slackChannelIds;
  }

  getLinearProjectId(): string | null {
    return this.linearProjectId;
  }

  getLinearTeamId(): string | null {
    return this.linearTeamId;
  }

  getNotionPageId(): string | null {
    return this.notionPageId;
  }

  getProductObjective(): string | null {
    return this.productObjective;
  }

  getKeyResults(): KeyResult[] {
    return this.keyResults;
  }

  getPmLeadName(): string | null {
    return this.pmLeadName;
  }

  getTechLeadName(): string | null {
    return this.techLeadName;
  }

  getWeekNumber(): number {
    return this.weekNumber;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  addSlackChannel(channelId: string): void {
    if (!this.slackChannelIds.includes(channelId)) {
      this.slackChannelIds = [...this.slackChannelIds, channelId];
      this.updatedAt = new Date();
    }
  }

  setLinearProject(projectId: string, teamId: string): void {
    this.linearProjectId = projectId;
    this.linearTeamId = teamId;
    this.updatedAt = new Date();
  }

  setNotionPage(pageId: string): void {
    this.notionPageId = pageId;
    this.updatedAt = new Date();
  }

  setProductObjective(objective: string, origin: string, krs: KeyResult[]): void {
    this.productObjective = objective;
    this.objectiveOrigin = origin;
    this.keyResults = krs;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  toJSON(): ProjectJSON {
    return {
      id: this.id,
      name: this.name,
      emoji: this.emoji,
      organizationId: this.organizationId,
      pmLeadName: this.pmLeadName,
      techLeadName: this.techLeadName,
      teamName: this.teamName,
      targetDate: this.targetDate,
      weekNumber: this.weekNumber,
      slackChannelIds: this.slackChannelIds,
      linearProjectId: this.linearProjectId,
      linearTeamId: this.linearTeamId,
      notionPageId: this.notionPageId,
      productObjective: this.productObjective,
      objectiveOrigin: this.objectiveOrigin,
      keyResults: this.keyResults,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
