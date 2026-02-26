import { Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from 'auth/current-user.decorator';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ReportRepository } from '@/reports/domain/repositories/report.repository';
import {
  GenerateReportCommand,
  GenerateReportHandler,
} from '../../application/commands/generate-report/generate-report.handler';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportRepo: ReportRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly generateReport: GenerateReportHandler,
  ) {}

  @Post('generate/:projectId')
  async generate(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.toJSON().organizationId !== user.orgId) {
      throw new NotFoundException('Project not found');
    }
    return this.generateReport.execute(new GenerateReportCommand(projectId));
  }

  @Get('latest')
  async getLatest(@CurrentUser() user: JwtPayload) {
    const projects = await this.projectRepo.findActiveByOrganizationId(user.orgId);
    const reports = await Promise.all(
      projects.map(async (project) => {
        const projectReports = await this.reportRepo.findByProjectId(project.getId());
        return projectReports[0] ?? null;
      }),
    );
    return reports.filter(Boolean).map((r) => r!.toJSON());
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const report = await this.reportRepo.findById(id);
    if (!report) throw new NotFoundException('Report not found');

    const project = await this.projectRepo.findById(report.getProjectId());
    if (!project || project.toJSON().organizationId !== user.orgId) {
      throw new NotFoundException('Report not found');
    }

    return report.toJSON();
  }
}
