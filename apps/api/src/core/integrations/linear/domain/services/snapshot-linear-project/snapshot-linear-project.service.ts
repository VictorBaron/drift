import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { LinearTicketSnapshot } from '../../aggregates/linear-ticket-snapshot.aggregate';
import { LINEAR_API_GATEWAY, LinearApiGateway, type LinearIssue } from '../../gateways/linear-api.gateway';
import { LinearTicketSnapshotRepository } from '../../repositories/linear-ticket-snapshot.repository';

export class SnapshotLinearProjectCommand {
  constructor(
    public readonly projectId: string,
    public readonly organizationId: string,
    public readonly decryptedLinearToken: string,
  ) {}
}

export interface SnapshotLinearProjectResult {
  snapshots: number;
}

@Injectable()
export class SnapshotLinearProjectService extends BaseService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly snapshotRepo: LinearTicketSnapshotRepository,
    @Inject(LINEAR_API_GATEWAY) private readonly linearApiGateway: LinearApiGateway,
  ) {
    super();
  }

  async execute(command: SnapshotLinearProjectCommand): Promise<SnapshotLinearProjectResult> {
    const { projectId, organizationId, decryptedLinearToken } = command;

    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const linearProjectId = project.getLinearProjectId();
    const linearTeamId = project.getLinearTeamId();

    if (!linearProjectId && !linearTeamId) {
      return { snapshots: 0 };
    }

    const since = await this.resolveSinceDate(projectId);
    const issues = await this.fetchIssues(decryptedLinearToken, linearProjectId, linearTeamId, since);
    const snapshots = this.buildSnapshots(issues, organizationId, projectId);

    if (snapshots.length > 0) {
      await this.snapshotRepo.saveMany(snapshots);
    }

    this.logger.log(`Project ${projectId}: ${snapshots.length} snapshots created`);
    return { snapshots: snapshots.length };
  }

  private async resolveSinceDate(projectId: string): Promise<Date> {
    const latestSnapshot = await this.snapshotRepo.findLatestByProjectId(projectId);
    if (latestSnapshot) {
      return latestSnapshot.toJSON().snapshotDate;
    }
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  private async fetchIssues(
    token: string,
    linearProjectId: string | null,
    linearTeamId: string | null,
    since: Date,
  ): Promise<LinearIssue[]> {
    if (linearProjectId) {
      return this.linearApiGateway.getProjectIssues(token, linearProjectId, since);
    }
    return this.linearApiGateway.getTeamIssues(token, linearTeamId!, since);
  }

  private buildSnapshots(issues: LinearIssue[], organizationId: string, projectId: string): LinearTicketSnapshot[] {
    const now = new Date();
    const weekStart = this.getMondayOfWeek(now);

    return issues.map((issue) =>
      LinearTicketSnapshot.snapshot({
        organizationId,
        projectId,
        linearIssueId: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        stateName: issue.stateName,
        stateType: issue.stateType,
        priority: issue.priority,
        assigneeName: issue.assigneeName,
        labelNames: issue.labelNames,
        commentCount: issue.commentCount,
        snapshotDate: now,
        snapshotWeekStart: weekStart,
      }),
    );
  }

  private getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}
