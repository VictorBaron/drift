import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Member } from '@/accounts/domain/aggregates/member.aggregate';
import { Organization } from '@/accounts/domain/aggregates/organization.aggregate';
import { MemberRepository } from '@/accounts/domain/repositories/member.repository';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { MemberRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/member.repository.in-memory';
import { OrganizationRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/organization.repository.in-memory';
import { SLACK_API_GATEWAY } from '@/integrations/slack/domain/gateways/slack-api.gateway';
import { SlackReportFormatterService } from '@/integrations/slack/domain/services/slack-report-formatter.service';
import { FakeSlackApiGateway } from '@/integrations/slack/infrastructure/gateways/fake-slack-api.gateway';
import { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ProjectRepositoryInMemory } from '@/projects/infrastructure/persistence/in-memory/project.repository.in-memory';
import { Report } from '@/reports/domain/aggregates/report.aggregate';
import { ReportRepository } from '@/reports/domain/repositories/report.repository';
import { ReportRepositoryInMemory } from '@/reports/infrastructure/persistence/in-memory/report.repository.in-memory';
import { DeliverPortfolioSummaryCommand, DeliverPortfolioSummaryHandler } from './deliver-portfolio-summary.handler';

const WEEK_START = new Date('2025-02-17');

function makeReport(projectId: string, weekStart = WEEK_START): Report {
  return Report.generate({
    organizationId: 'org-123',
    projectId,
    weekStart,
    weekEnd: new Date('2025-02-23'),
    weekNumber: 8,
    periodLabel: 'Week 8 · Feb 17–23',
    content: {
      health: 'on-track',
      healthLabel: 'On Track',
      progress: 68,
      narrative: 'Strong velocity.',
      decisions: [],
      drift: { level: 'none', label: 'No Drift', details: '' },
      blockers: [],
      keyResults: [],
      threads: [],
      delivery: { merged: 5, inReview: 2, blocked: 1, created: 8, velocity: '+18%', velocityLabel: 'vs last week' },
      sourceCounts: { slack: 10, linear: 5, notion: 1 },
    },
    health: 'on-track',
    driftLevel: 'none',
    progress: 68,
    prevProgress: 61,
    slackMessageCount: 10,
    linearTicketCount: 5,
    notionPagesRead: 1,
    modelUsed: 'claude-sonnet-4-6',
    promptTokens: 100,
    completionTokens: 200,
    generationTimeMs: 1500,
  });
}

describe('DeliverPortfolioSummaryHandler', () => {
  let handler: DeliverPortfolioSummaryHandler;
  let orgRepo: OrganizationRepositoryInMemory;
  let projectRepo: ProjectRepositoryInMemory;
  let reportRepo: ReportRepositoryInMemory;
  let memberRepo: MemberRepositoryInMemory;
  let slackGateway: FakeSlackApiGateway;

  let org: Organization;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliverPortfolioSummaryHandler,
        SlackReportFormatterService,
        { provide: OrganizationRepository, useClass: OrganizationRepositoryInMemory },
        { provide: ProjectRepository, useClass: ProjectRepositoryInMemory },
        { provide: ReportRepository, useClass: ReportRepositoryInMemory },
        { provide: MemberRepository, useClass: MemberRepositoryInMemory },
        { provide: SLACK_API_GATEWAY, useClass: FakeSlackApiGateway },
      ],
    }).compile();

    handler = module.get(DeliverPortfolioSummaryHandler);
    orgRepo = module.get(OrganizationRepository);
    projectRepo = module.get(ProjectRepository);
    reportRepo = module.get(ReportRepository);
    memberRepo = module.get(MemberRepository);
    slackGateway = module.get(SLACK_API_GATEWAY);

    orgRepo.clear();
    projectRepo.clear();
    reportRepo.clear();
    memberRepo.clear();
    slackGateway.clear();

    org = Organization.create({ name: 'Acme', slackTeamId: 'T123', slackBotToken: 'bot-token' });
    await orgRepo.save(org);
  });

  it('should send a portfolio summary DM to all admins', async () => {
    const p1 = Project.create({ name: 'Checkout Revamp', emoji: '💳', organizationId: org.getId() });
    const p2 = Project.create({ name: 'Mobile App', emoji: '📱', organizationId: org.getId() });
    await projectRepo.save(p1);
    await projectRepo.save(p2);

    await reportRepo.save(makeReport(p1.getId()));
    await reportRepo.save(makeReport(p2.getId()));

    const admin = Member.create({
      email: 'admin@acme.com',
      name: 'Admin',
      slackUserId: 'U_ADMIN',
      avatarUrl: null,
      role: 'admin',
      organizationId: org.getId(),
    });
    await memberRepo.save(admin);

    await handler.execute(new DeliverPortfolioSummaryCommand(org.getId(), WEEK_START));

    const posted = slackGateway.getPostedMessages();
    expect(posted).toHaveLength(1);
    expect(posted[0].channelId).toBe('dm_U_ADMIN');
  });

  it('should skip delivery when no reports exist for the week', async () => {
    const admin = Member.create({
      email: 'admin@acme.com',
      name: 'Admin',
      slackUserId: 'U_ADMIN',
      avatarUrl: null,
      role: 'admin',
      organizationId: org.getId(),
    });
    await memberRepo.save(admin);

    await handler.execute(new DeliverPortfolioSummaryCommand(org.getId(), WEEK_START));

    expect(slackGateway.getPostedMessages()).toHaveLength(0);
  });

  it('should only include projects that have a report for the given week', async () => {
    const p1 = Project.create({ name: 'Checkout Revamp', emoji: '💳', organizationId: org.getId() });
    const p2 = Project.create({ name: 'Mobile App', emoji: '📱', organizationId: org.getId() });
    await projectRepo.save(p1);
    await projectRepo.save(p2);

    // Only p1 has a report for WEEK_START
    await reportRepo.save(makeReport(p1.getId()));
    // p2 has a report for a different week
    await reportRepo.save(makeReport(p2.getId(), new Date('2025-02-10')));

    const admin = Member.create({
      email: 'admin@acme.com',
      name: 'Admin',
      slackUserId: 'U_ADMIN',
      avatarUrl: null,
      role: 'admin',
      organizationId: org.getId(),
    });
    await memberRepo.save(admin);

    await handler.execute(new DeliverPortfolioSummaryCommand(org.getId(), WEEK_START));

    // Should still send because p1 has a report
    expect(slackGateway.getPostedMessages()).toHaveLength(1);
  });

  it('should throw if organization does not exist', async () => {
    await expect(handler.execute(new DeliverPortfolioSummaryCommand('non-existent-org', WEEK_START))).rejects.toThrow(
      'Organization not found',
    );
  });
});
