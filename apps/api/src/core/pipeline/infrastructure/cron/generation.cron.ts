import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BaseService } from 'common/application/service';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import {
  DeliverPortfolioSummaryCommand,
  DeliverPortfolioSummaryHandler,
} from '@/integrations/slack/application/commands/deliver-portfolio-summary/deliver-portfolio-summary.handler';
import {
  DeliverReportCommand,
  DeliverReportHandler,
} from '@/integrations/slack/application/commands/deliver-report/deliver-report.handler';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import {
  GenerateReportCommand,
  GenerateReportHandler,
} from '../../application/commands/generate-report/generate-report.handler';

@Injectable()
export class GenerationCronService extends BaseService {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly generateReport: GenerateReportHandler,
    private readonly deliverReport: DeliverReportHandler,
    private readonly deliverPortfolioSummary: DeliverPortfolioSummaryHandler,
  ) {
    super();
  }

  @Cron('0 7 * * 1')
  async run(): Promise<void> {
    const organizations = await this.organizationRepo.findAll();
    this.logger.log(`Starting weekly report generation for ${organizations.length} organization(s)`);

    const weekStart = this.currentWeekStart();

    for (const org of organizations) {
      await this.generateForOrganization(org.getId(), weekStart);
    }
  }

  private async generateForOrganization(organizationId: string, weekStart: Date): Promise<void> {
    const projects = await this.projectRepo.findActiveByOrganizationId(organizationId);
    this.logger.log(`Organization ${organizationId}: generating reports for ${projects.length} active project(s)`);

    for (const project of projects) {
      await this.generateAndDeliverReport(project.getId());
    }

    await this.deliverPortfolioSummaryForOrganization(organizationId, weekStart);
  }

  private async generateAndDeliverReport(projectId: string): Promise<void> {
    try {
      const result = await this.generateReport.execute(new GenerateReportCommand(projectId));
      this.logger.log(`Report ${result.reportId} generated for project ${projectId}`);

      try {
        await this.deliverReport.execute(new DeliverReportCommand(result.reportId));
        this.logger.log(`Report ${result.reportId} delivered via Slack`);
      } catch (err) {
        this.logger.error(`Failed to deliver report ${result.reportId}: ${err}`);
      }
    } catch (err) {
      this.logger.error(`Failed to generate report for project ${projectId}: ${err}`);
    }
  }

  private async deliverPortfolioSummaryForOrganization(organizationId: string, weekStart: Date): Promise<void> {
    try {
      await this.deliverPortfolioSummary.execute(new DeliverPortfolioSummaryCommand(organizationId, weekStart));
      this.logger.log(`Portfolio summary delivered for organization ${organizationId}`);
    } catch (err) {
      this.logger.error(`Failed to deliver portfolio summary for organization ${organizationId}: ${err}`);
    }
  }

  private currentWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - daysFromMonday);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  }
}
