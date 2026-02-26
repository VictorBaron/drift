import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ComputeDeliveryStatsHandler } from '@/integrations/linear/application/queries/compute-delivery-stats/compute-delivery-stats.query';
import { LinearTicketSnapshotRepository } from '@/integrations/linear/domain/repositories/linear-ticket-snapshot.repository';
import { LinearTicketSnapshotRepositoryInMemory } from '@/integrations/linear/infrastructure/persistence/in-memory/linear-ticket-snapshot.repository.in-memory';
import { HasNotionPageChangedQuery } from '@/integrations/notion/application/queries/has-notion-page-changed/has-notion-page-changed.query';
import { ReadNotionPageQuery } from '@/integrations/notion/application/queries/read-notion-page/read-notion-page.query';
import { NOTION_API_GATEWAY } from '@/integrations/notion/domain/gateways/notion-api.gateway';
import { FakeNotionApiGateway } from '@/integrations/notion/infrastructure/gateways/fake-notion-api.gateway';
import { SlackMessageRepository } from '@/integrations/slack/domain/repositories/slack-message.repository';
import { SlackMessageRepositoryInMemory } from '@/integrations/slack/infrastructure/persistence/in-memory/slack-message.repository.in-memory';
import { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ProjectRepositoryInMemory } from '@/projects/infrastructure/persistence/in-memory/project.repository.in-memory';
import { ReportRepository } from '@/reports/domain/repositories/report.repository';
import { ReportRepositoryInMemory } from '@/reports/infrastructure/persistence/in-memory/report.repository.in-memory';
import { LLM_GATEWAY } from '../../../domain/gateways/llm.gateway';
import { PromptBuilderService } from '../../../domain/services/prompt-builder.service';
import { ReportParserService } from '../../../domain/services/report-parser.service';
import { FakeLlmGateway } from '../../../infrastructure/gateways/fake-llm.gateway';
import { GenerateReportCommand, GenerateReportHandler } from './generate-report.handler';

describe('GenerateReportHandler', () => {
  let handler: GenerateReportHandler;
  let projectRepo: ProjectRepositoryInMemory;
  let reportRepo: ReportRepositoryInMemory;
  let fakeLlmGateway: FakeLlmGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateReportHandler,
        PromptBuilderService,
        ReportParserService,
        ComputeDeliveryStatsHandler,
        ReadNotionPageQuery,
        HasNotionPageChangedQuery,
        { provide: ProjectRepository, useClass: ProjectRepositoryInMemory },
        { provide: ReportRepository, useClass: ReportRepositoryInMemory },
        { provide: SlackMessageRepository, useClass: SlackMessageRepositoryInMemory },
        { provide: LinearTicketSnapshotRepository, useClass: LinearTicketSnapshotRepositoryInMemory },
        { provide: LLM_GATEWAY, useClass: FakeLlmGateway },
        { provide: NOTION_API_GATEWAY, useClass: FakeNotionApiGateway },
      ],
    }).compile();

    handler = module.get(GenerateReportHandler);
    projectRepo = module.get(ProjectRepository);
    reportRepo = module.get(ReportRepository);
    fakeLlmGateway = module.get(LLM_GATEWAY);

    projectRepo.clear();
    reportRepo.clear();
  });

  it('should generate and save a report for a project', async () => {
    const project = Project.create({
      name: 'Test Project',
      emoji: '::rocket::',
      organizationId: 'org-1',
    });
    await projectRepo.save(project);

    const result = await handler.execute(new GenerateReportCommand(project.getId()));

    expect(result.reportId).toBeDefined();
    const report = await reportRepo.findById(result.reportId);
    expect(report).toBeDefined();
    expect(report!.getProjectId()).toBe(project.getId());
    expect(report!.getHealth()).toBe('on-track');
    expect(report!.getProgress()).toBe(60);
  });

  it('should throw if project does not exist', async () => {
    await expect(handler.execute(new GenerateReportCommand('non-existent-id'))).rejects.toThrow('Project not found');
  });

  it('should include LLM token counts in the report', async () => {
    const project = Project.create({ name: 'Token Test', emoji: '::chart::', organizationId: 'org-1' });
    await projectRepo.save(project);

    const result = await handler.execute(new GenerateReportCommand(project.getId()));
    const report = await reportRepo.findById(result.reportId);

    expect(report!.toJSON().promptTokens).toBe(100);
    expect(report!.toJSON().completionTokens).toBe(200);
  });

  it('should use drift level from LLM content', async () => {
    const project = Project.create({ name: 'Drift Test', emoji: '::chart_down::', organizationId: 'org-1' });
    await projectRepo.save(project);

    fakeLlmGateway.setResponse(
      JSON.stringify({
        health: 'at-risk',
        healthLabel: 'At Risk',
        progress: 30,
        narrative: 'Project is at risk.',
        decisions: [],
        drift: { level: 'high', label: 'Significant Drift', details: 'Scope has changed significantly.' },
        blockers: [
          { text: 'Missing API', owner: 'Alice', severity: 'high', since: '2 days', impact: 'Blocks release' },
        ],
        keyResults: [],
        threads: [],
        delivery: { merged: 1, inReview: 3, blocked: 2, created: 4, velocity: '-50%', velocityLabel: 'vs last week' },
        sourceCounts: { slack: 5, linear: 8, notion: 0 },
      }),
    );

    const result = await handler.execute(new GenerateReportCommand(project.getId()));
    const report = await reportRepo.findById(result.reportId);

    expect(report!.getDriftLevel()).toBe('high');
    expect(report!.getHealth()).toBe('at-risk');
  });
});
