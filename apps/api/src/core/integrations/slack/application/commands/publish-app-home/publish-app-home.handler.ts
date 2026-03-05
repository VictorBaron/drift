import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { SLACK_API_GATEWAY, SlackApiGateway } from '@/integrations/slack/domain/gateways/slack-api.gateway';
import {
  AppHomeBuilderService,
  type AppHomeProjectSummary,
} from '@/integrations/slack/domain/services/app-home-builder/app-home-builder.service';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ReportRepository } from '@/reports/domain/repositories/report.repository';

export class PublishAppHomeCommand {
  constructor(
    public readonly slackUserId: string,
    public readonly slackTeamId: string,
  ) {}
}

@Injectable()
export class PublishAppHomeHandler {
  private readonly logger = new Logger(PublishAppHomeHandler.name);

  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly reportRepo: ReportRepository,
    @Inject(SLACK_API_GATEWAY) private readonly slackApi: SlackApiGateway,
    private readonly builder: AppHomeBuilderService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: PublishAppHomeCommand): Promise<void> {
    const { slackUserId, slackTeamId } = command;
    const webUrl = this.config.getOrThrow<string>('WEB_URL');

    try {
      const org = await this.orgRepo.findBySlackTeamId(slackTeamId);
      if (!org) {
        this.logger.warn(`Organization not found for Slack team: ${slackTeamId}`);
        return;
      }

      const projects = await this.projectRepo.findActiveByOrganizationId(org.getId());
      const view =
        projects.length === 0
          ? this.builder.buildOnboardingView(webUrl)
          : await this.buildProjectsView(projects, webUrl);

      await this.slackApi.publishAppHome(org.getSlackBotToken(), slackUserId, view);
    } catch (err) {
      this.logger.error(`Failed to publish App Home for user ${slackUserId}: ${err}`);
    }
  }

  private async buildProjectsView(
    projects: Awaited<ReturnType<ProjectRepository['findActiveByOrganizationId']>>,
    webUrl: string,
  ) {
    const summaries: AppHomeProjectSummary[] = await Promise.all(
      projects.map(async (project) => {
        const reports = await this.reportRepo.findByProjectId(project.getId());
        const latest = reports.sort((a, b) => b.getWeekStart().getTime() - a.getWeekStart().getTime())[0];

        return {
          project: project.toJSON(),
          health: latest?.getHealth() ?? null,
          progress: latest?.getProgress() ?? null,
        };
      }),
    );

    return this.builder.buildProjectsView(summaries, webUrl);
  }
}
