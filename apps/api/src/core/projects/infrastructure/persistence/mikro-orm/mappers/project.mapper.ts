import { rel } from '@mikro-orm/core';
import { OrganizationMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models';
import { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectMikroOrm } from '../models/project.mikroORM';

export class ProjectMapper {
  static toDomain(raw: ProjectMikroOrm): Project {
    return Project.reconstitute({
      id: raw.id,
      name: raw.name,
      emoji: raw.emoji,
      organizationId: raw.organization.id,
      pmLeadName: raw.pmLeadName,
      techLeadName: raw.techLeadName,
      teamName: raw.teamName,
      targetDate: raw.targetDate,
      weekNumber: raw.weekNumber,
      slackChannelIds: raw.slackChannelIds,
      linearProjectId: raw.linearProjectId,
      linearTeamId: raw.linearTeamId,
      notionPageId: raw.notionPageId,
      productObjective: raw.productObjective,
      objectiveOrigin: raw.objectiveOrigin,
      keyResults: raw.keyResults ?? [],
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(project: Project): ProjectMikroOrm {
    const json = project.toJSON();
    return ProjectMikroOrm.build({
      id: json.id,
      name: json.name,
      emoji: json.emoji,
      organization: rel(OrganizationMikroOrm, json.organizationId),
      pmLeadName: json.pmLeadName,
      techLeadName: json.techLeadName,
      teamName: json.teamName,
      targetDate: json.targetDate,
      weekNumber: json.weekNumber,
      slackChannelIds: json.slackChannelIds,
      linearProjectId: json.linearProjectId,
      linearTeamId: json.linearTeamId,
      notionPageId: json.notionPageId,
      productObjective: json.productObjective,
      objectiveOrigin: json.objectiveOrigin,
      keyResults: json.keyResults.length > 0 ? json.keyResults : null,
      isActive: json.isActive,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      deletedAt: json.deletedAt,
    });
  }
}
