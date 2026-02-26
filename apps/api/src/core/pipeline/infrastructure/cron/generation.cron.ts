import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BaseService } from 'common/application/service';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
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
  ) {
    super();
  }

  @Cron('0 7 * * 1')
  async run(): Promise<void> {
    const organizations = await this.organizationRepo.findAll();
    this.logger.log(`Starting weekly report generation for ${organizations.length} organization(s)`);

    for (const org of organizations) {
      await this.generateForOrganization(org.getId());
    }
  }

  private async generateForOrganization(organizationId: string): Promise<void> {
    const projects = await this.projectRepo.findActiveByOrganizationId(organizationId);
    this.logger.log(`Organization ${organizationId}: generating reports for ${projects.length} active project(s)`);

    for (const project of projects) {
      try {
        const result = await this.generateReport.execute(new GenerateReportCommand(project.getId()));
        this.logger.log(`Report ${result.reportId} generated for project ${project.getId()}`);
      } catch (err) {
        this.logger.error(`Failed to generate report for project ${project.getId()}: ${err}`);
      }
    }
  }
}
