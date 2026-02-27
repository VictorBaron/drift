import { rel } from '@mikro-orm/core';
import { OrganizationMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/organization.mikroORM';
import { ProjectMikroOrm } from '@/projects/infrastructure/persistence/mikro-orm/models/project.mikroORM';
import { Report } from '@/reports/domain/aggregates/report.aggregate';
import { ReportMikroOrm } from '../models/report.mikroORM';

export class ReportMapper {
  static toDomain(raw: ReportMikroOrm): Report {
    return Report.reconstitute({
      id: raw.id,
      organizationId: raw.organization.id,
      projectId: raw.project.id,
      weekStart: raw.weekStart,
      weekEnd: raw.weekEnd,
      weekNumber: raw.weekNumber,
      periodLabel: raw.periodLabel,
      content: raw.content,
      health: raw.health,
      driftLevel: raw.driftLevel,
      progress: raw.progress,
      prevProgress: raw.prevProgress,
      slackMessageCount: raw.slackMessageCount,
      linearTicketCount: raw.linearTicketCount,
      notionPagesRead: raw.notionPagesRead,
      modelUsed: raw.modelUsed,
      promptTokens: raw.promptTokens,
      completionTokens: raw.completionTokens,
      generationTimeMs: raw.generationTimeMs,
      generatedAt: raw.generatedAt,
      slackDeliveredAt: raw.slackDeliveredAt,
      slackMessageTs: raw.slackMessageTs,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(report: Report): ReportMikroOrm {
    const json = report.toJSON();
    return ReportMikroOrm.build({
      id: json.id,
      organization: rel(OrganizationMikroOrm, json.organizationId),
      project: rel(ProjectMikroOrm, json.projectId),
      weekStart: json.weekStart,
      weekEnd: json.weekEnd,
      weekNumber: json.weekNumber,
      periodLabel: json.periodLabel,
      content: json.content,
      health: json.health,
      driftLevel: json.driftLevel,
      progress: json.progress,
      prevProgress: json.prevProgress,
      slackMessageCount: json.slackMessageCount,
      linearTicketCount: json.linearTicketCount,
      notionPagesRead: json.notionPagesRead,
      modelUsed: json.modelUsed,
      promptTokens: json.promptTokens,
      completionTokens: json.completionTokens,
      generationTimeMs: json.generationTimeMs,
      generatedAt: json.generatedAt,
      slackDeliveredAt: json.slackDeliveredAt,
      slackMessageTs: json.slackMessageTs,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      deletedAt: json.deletedAt,
    });
  }
}
