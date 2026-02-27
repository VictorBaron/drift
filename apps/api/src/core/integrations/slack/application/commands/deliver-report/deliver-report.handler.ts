import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';
import type { Member } from '@/accounts/domain/aggregates/member.aggregate';
import { MemberRepository } from '@/accounts/domain/repositories/member.repository';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { SLACK_API_GATEWAY, SlackApiGateway } from '@/integrations/slack/domain/gateways/slack-api.gateway';
import { SlackReportFormatterService } from '@/integrations/slack/domain/services/slack-report-formatter.service';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ReportRepository } from '@/reports/domain/repositories/report.repository';

export class DeliverReportCommand {
  constructor(public readonly reportId: string) {}
}

@Injectable()
export class DeliverReportHandler extends BaseService {
  constructor(
    private readonly reportRepo: ReportRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly orgRepo: OrganizationRepository,
    private readonly memberRepo: MemberRepository,
    @Inject(SLACK_API_GATEWAY) private readonly slackApi: SlackApiGateway,
    private readonly formatter: SlackReportFormatterService,
  ) {
    super();
  }

  async execute(command: DeliverReportCommand): Promise<void> {
    const { report, project, org } = await this.loadResources(command.reportId);

    const admins = await this.findAdmins(org.getId());
    if (admins.length === 0) {
      this.logger.warn(`No admins found for organization ${org.getId()}, skipping delivery`);
      return;
    }

    const blocks = this.formatter.formatReport(
      report.getContent(),
      project,
      report.getWeekNumber(),
      report.getPrevProgress(),
      report.getPeriodLabel(),
    );

    const firstMessageTs = await this.sendDmsToAdmins(org.getSlackBotToken(), admins, blocks);

    if (firstMessageTs) {
      report.markDelivered(firstMessageTs);
      await this.reportRepo.save(report);
    }
  }

  private async loadResources(reportId: string) {
    const report = await this.reportRepo.findById(reportId);
    if (!report) throw new Error(`Report not found: ${reportId}`);

    const project = await this.projectRepo.findById(report.getProjectId());
    if (!project) throw new Error(`Project not found: ${report.getProjectId()}`);

    const org = await this.orgRepo.findById(project.getOrganizationId());
    if (!org) throw new Error(`Organization not found: ${project.getOrganizationId()}`);

    return { report, project, org };
  }

  private async findAdmins(organizationId: string): Promise<Member[]> {
    const members = await this.memberRepo.findByOrganizationId(organizationId);
    return members.filter((m) => m.isAdmin());
  }

  private async sendDmsToAdmins(token: string, admins: Member[], blocks: unknown[]): Promise<string | null> {
    let firstTs: string | null = null;

    for (const admin of admins) {
      try {
        const result = await this.slackApi.postDM(token, admin.getSlackUserId(), blocks);
        if (!firstTs) firstTs = result.ts;
      } catch (err) {
        this.logger.error(`Failed to send DM to admin ${admin.getId()}: ${err}`);
      }
    }

    return firstTs;
  }
}
