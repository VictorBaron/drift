import { Injectable } from '@nestjs/common';
import { type KeyResult, Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';

export class CreateProjectCommand {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
    public readonly emoji: string,
    public readonly pmLeadName: string | null,
    public readonly techLeadName: string | null,
    public readonly teamName: string | null,
    public readonly targetDate: Date | null,
    public readonly slackChannelIds: string[],
    public readonly linearProjectId: string | null,
    public readonly linearTeamId: string | null,
    public readonly notionPageId: string | null,
    public readonly productObjective: string | null,
    public readonly objectiveOrigin: string | null,
    public readonly keyResults: KeyResult[],
  ) {}
}

@Injectable()
export class CreateProjectHandler {
  constructor(private readonly projectRepo: ProjectRepository) {}

  async execute(command: CreateProjectCommand): Promise<Project> {
    const project = Project.create({
      name: command.name,
      emoji: command.emoji,
      organizationId: command.organizationId,
      pmLeadName: command.pmLeadName,
      techLeadName: command.techLeadName,
      teamName: command.teamName,
      targetDate: command.targetDate,
    });

    for (const channelId of command.slackChannelIds) {
      project.addSlackChannel(channelId);
    }

    if (command.linearProjectId && command.linearTeamId) {
      project.setLinearProject(command.linearProjectId, command.linearTeamId);
    }

    if (command.notionPageId) {
      project.setNotionPage(command.notionPageId);
    }

    if (command.productObjective) {
      project.setProductObjective(command.productObjective, command.objectiveOrigin ?? 'manual', command.keyResults);
    }

    await this.projectRepo.save(project);
    return project;
  }
}
