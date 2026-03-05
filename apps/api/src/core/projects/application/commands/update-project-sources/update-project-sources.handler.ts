import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';

export class UpdateProjectSourcesCommand {
  constructor(
    public readonly projectId: string,
    public readonly organizationId: string,
    public readonly slackChannelIds: string[],
    public readonly linearTeamId: string | null,
    public readonly linearProjectId: string | null,
    public readonly notionPageId: string | null,
  ) {}
}

@Injectable()
export class UpdateProjectSourcesHandler {
  constructor(private readonly projectRepo: ProjectRepository) {}

  async execute(command: UpdateProjectSourcesCommand): Promise<void> {
    const project = await this.projectRepo.findById(command.projectId);

    if (!project || project.getOrganizationId() !== command.organizationId) {
      throw new NotFoundException('Project not found');
    }

    project.updateSources(command.slackChannelIds, command.linearTeamId, command.linearProjectId, command.notionPageId);

    await this.projectRepo.save(project);
  }
}
