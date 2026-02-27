import { Controller, Get } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from 'auth/current-user.decorator';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectRepo: ProjectRepository) {}

  @Get()
  async getAll(@CurrentUser() user: JwtPayload) {
    const projects = await this.projectRepo.findActiveByOrganizationId(user.orgId);
    return projects.map((p) => p.toJSON());
  }
}
