import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';
import type { Member } from '@/accounts/domain/aggregates/member.aggregate';
import { MemberRepository } from '@/accounts/domain/repositories/member.repository';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { SLACK_API_GATEWAY, SlackApiGateway } from '@/integrations/slack/domain/gateways/slack-api.gateway';
import {
  type ProjectReportSummary,
  SlackReportFormatterService,
} from '@/integrations/slack/domain/services/slack-report-formatter.service';
import type { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import type { Report } from '@/reports/domain/aggregates/report.aggregate';
import { ReportRepository } from '@/reports/domain/repositories/report.repository';

export class DeliverPortfolioSummaryCommand {
  constructor(
    public readonly organizationId: string,
    public readonly weekStart: Date,
  ) {}
}

@Injectable()
export class DeliverPortfolioSummaryHandler extends BaseService {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly reportRepo: ReportRepository,
    private readonly memberRepo: MemberRepository,
    @Inject(SLACK_API_GATEWAY) private readonly slackApi: SlackApiGateway,
    private readonly formatter: SlackReportFormatterService,
  ) {
    super();
  }

  async execute(command: DeliverPortfolioSummaryCommand): Promise<void> {
    const { organizationId, weekStart } = command;

    const org = await this.orgRepo.findById(organizationId);
    if (!org) throw new Error(`Organization not found: ${organizationId}`);

    const summaries = await this.collectSummaries(organizationId, weekStart);
    if (summaries.length === 0) {
      this.logger.warn(`No reports found for organization ${organizationId} week ${weekStart.toISOString()}`);
      return;
    }

    const admins = await this.findAdmins(organizationId);
    if (admins.length === 0) {
      this.logger.warn(`No admins found for organization ${organizationId}, skipping portfolio delivery`);
      return;
    }

    const weekNumber = this.isoWeekNumber(weekStart);
    const blocks = this.formatter.formatPortfolioSummary(summaries, weekNumber);
    const token = org.getSlackBotToken();

    await this.sendDmsToAdmins(token, admins, blocks);
  }

  private async collectSummaries(organizationId: string, weekStart: Date): Promise<ProjectReportSummary[]> {
    const projects = await this.projectRepo.findActiveByOrganizationId(organizationId);
    const summaries: ProjectReportSummary[] = [];

    for (const project of projects) {
      const report = await this.reportRepo.findByProjectAndWeek(project.getId(), weekStart);
      if (report) {
        summaries.push(this.toSummary(report, project));
      }
    }

    return summaries;
  }

  private toSummary(report: Report, project: Project): ProjectReportSummary {
    const content = report.getContent();
    return {
      projectName: project.getName(),
      projectEmoji: project.getEmoji(),
      health: content.health,
      healthLabel: content.healthLabel,
      progress: content.progress,
      prevProgress: report.getPrevProgress(),
    };
  }

  private async findAdmins(organizationId: string): Promise<Member[]> {
    const members = await this.memberRepo.findByOrganizationId(organizationId);
    return members.filter((m) => m.isAdmin());
  }

  private async sendDmsToAdmins(token: string, admins: Member[], blocks: unknown[]): Promise<void> {
    for (const admin of admins) {
      try {
        await this.slackApi.postDM(token, admin.getSlackUserId(), blocks);
      } catch (err) {
        this.logger.error(`Failed to send portfolio summary DM to admin ${admin.getId()}: ${err}`);
      }
    }
  }

  private isoWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
