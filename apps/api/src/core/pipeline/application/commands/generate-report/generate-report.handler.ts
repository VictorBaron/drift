import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';
import { ComputeDeliveryStatsHandler } from '@/integrations/linear/application/queries/compute-delivery-stats/compute-delivery-stats.query';
import { LinearTicketSnapshotRepository } from '@/integrations/linear/domain/repositories/linear-ticket-snapshot.repository';
import { HasNotionPageChangedQuery } from '@/integrations/notion/application/queries/has-notion-page-changed/has-notion-page-changed.query';
import { ReadNotionPageQuery } from '@/integrations/notion/application/queries/read-notion-page/read-notion-page.query';
import type { SlackMessage } from '@/integrations/slack/domain/aggregates/slack-message.aggregate';
import { SlackMessageRepository } from '@/integrations/slack/domain/repositories/slack-message.repository';
import type { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { Report } from '@/reports/domain/aggregates/report.aggregate';
import { ReportRepository } from '@/reports/domain/repositories/report.repository';
import { LLM_GATEWAY, LlmGateway } from '../../../domain/gateways/llm.gateway';
import { PromptBuilderService } from '../../../domain/services/prompt-builder.service';
import { ReportParserService } from '../../../domain/services/report-parser.service';

export class GenerateReportCommand {
  constructor(public readonly projectId: string) {}
}

export interface GenerateReportResult {
  reportId: string;
}

@Injectable()
export class GenerateReportHandler extends BaseService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly slackMessageRepo: SlackMessageRepository,
    private readonly snapshotRepo: LinearTicketSnapshotRepository,
    private readonly reportRepo: ReportRepository,
    private readonly computeDeliveryStats: ComputeDeliveryStatsHandler,
    private readonly readNotionPage: ReadNotionPageQuery,
    private readonly hasNotionPageChanged: HasNotionPageChangedQuery,
    private readonly promptBuilder: PromptBuilderService,
    private readonly reportParser: ReportParserService,
    @Inject(LLM_GATEWAY) private readonly llmGateway: LlmGateway,
  ) {
    super();
  }

  async execute(command: GenerateReportCommand): Promise<GenerateReportResult> {
    const start = Date.now();
    const { projectId } = command;

    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const weekStart = this.currentWeekStart();
    const weekEnd = this.weekEnd(weekStart);

    const [slackMessages, linearSnapshots, deliveryStats, notionContent, previousReport] = await Promise.all([
      this.fetchUnfilteredSlackMessages(projectId, weekStart),
      this.snapshotRepo.findByProjectAndWeek(projectId, weekStart),
      this.computeDeliveryStats.execute({ projectId, weekStart, weekEnd }),
      this.fetchNotionContent(project, weekStart),
      this.reportRepo.findByProjectAndWeek(projectId, this.previousWeekStart(weekStart)),
    ]);

    this.logger.log(
      `Generating report for project ${projectId}: ${slackMessages.length} messages, ${linearSnapshots.length} tickets`,
    );

    const { systemPrompt, userPrompt } = this.promptBuilder.buildPrompt({
      project,
      slackMessages,
      linearSnapshots,
      deliveryStats,
      notionContent,
      previousReport,
    });

    const llmResult = await this.llmGateway.generate(systemPrompt, userPrompt);
    const content = await this.reportParser.parseReport(llmResult.content);

    const generationTimeMs = Date.now() - start;
    const report = Report.generate({
      projectId,
      weekStart,
      weekEnd,
      weekNumber: project.toJSON().weekNumber,
      periodLabel: this.periodLabel(weekStart, weekEnd),
      content,
      health: content.health,
      driftLevel: content.drift.level,
      progress: content.progress,
      prevProgress: previousReport?.getProgress() ?? 0,
      slackMessageCount: slackMessages.length,
      linearTicketCount: linearSnapshots.length,
      notionPagesRead: notionContent ? 1 : 0,
      modelUsed: 'claude-sonnet-4-20250514',
      promptTokens: llmResult.promptTokens,
      completionTokens: llmResult.completionTokens,
      generationTimeMs,
    });

    await this.reportRepo.save(report);

    this.logger.log(
      `Report ${report.getId()} generated for project ${projectId} in ${generationTimeMs}ms (tokens: ${llmResult.promptTokens}+${llmResult.completionTokens})`,
    );

    return { reportId: report.getId() };
  }

  private async fetchUnfilteredSlackMessages(projectId: string, since: Date): Promise<SlackMessage[]> {
    const messages = await this.slackMessageRepo.findByProjectId(projectId, since);
    return messages.filter((m) => !m.getIsFiltered());
  }

  private async fetchNotionContent(project: Project, weekStart: Date): Promise<string | null> {
    const pageId = project.getNotionPageId();
    if (!pageId) return null;

    try {
      const changed = await this.hasNotionPageChanged.execute({ pageId, since: weekStart });
      if (!changed) return null;
      return this.readNotionPage.execute({ pageId });
    } catch (err) {
      this.logger.warn(`Failed to read Notion page ${pageId}: ${err}`);
      return null;
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

  private weekEnd(weekStart: Date): Date {
    const end = new Date(weekStart);
    end.setUTCDate(weekStart.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);
    return end;
  }

  private previousWeekStart(weekStart: Date): Date {
    const prev = new Date(weekStart);
    prev.setUTCDate(weekStart.getUTCDate() - 7);
    return prev;
  }

  private periodLabel(weekStart: Date, weekEnd: Date): string {
    const weekNum = this.isoWeekNumber(weekStart);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `Week ${weekNum} \u00B7 ${fmt(weekStart)}\u2013${fmt(weekEnd)}`;
  }

  private isoWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
