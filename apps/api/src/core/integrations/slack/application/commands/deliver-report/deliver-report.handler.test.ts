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
import { DeliverReportCommand, DeliverReportHandler } from './deliver-report.handler';

function makeReport(projectId: string, organizationId: string): Report {
  return Report.generate({
    organizationId,
    projectId,
    weekStart: new Date('2025-02-17'),
    weekEnd: new Date('2025-02-23'),
    weekNumber: 8,
    periodLabel: 'Week 8 · Feb 17–23',
    content: {
      health: 'on-track',
      healthLabel: 'On Track',
      progress: 68,
      narrative: 'Strong engineering velocity.',
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
    modelUsed: 'claude-sonnet-4-20250514',
    promptTokens: 100,
    completionTokens: 200,
    generationTimeMs: 1500,
  });
}

describe('DeliverReportHandler', () => {
  let handler: DeliverReportHandler;
  let reportRepo: ReportRepositoryInMemory;
  let projectRepo: ProjectRepositoryInMemory;
  let orgRepo: OrganizationRepositoryInMemory;
  let memberRepo: MemberRepositoryInMemory;
  let slackGateway: FakeSlackApiGateway;

  let org: Organization;
  let project: Project;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliverReportHandler,
        SlackReportFormatterService,
        { provide: ReportRepository, useClass: ReportRepositoryInMemory },
        { provide: ProjectRepository, useClass: ProjectRepositoryInMemory },
        { provide: OrganizationRepository, useClass: OrganizationRepositoryInMemory },
        { provide: MemberRepository, useClass: MemberRepositoryInMemory },
        { provide: SLACK_API_GATEWAY, useClass: FakeSlackApiGateway },
      ],
    }).compile();

    handler = module.get(DeliverReportHandler);
    reportRepo = module.get(ReportRepository);
    projectRepo = module.get(ProjectRepository);
    orgRepo = module.get(OrganizationRepository);
    memberRepo = module.get(MemberRepository);
    slackGateway = module.get(SLACK_API_GATEWAY);

    reportRepo.clear();
    projectRepo.clear();
    orgRepo.clear();
    memberRepo.clear();
    slackGateway.clear();

    org = Organization.create({ name: 'Acme', slackTeamId: 'T123', slackBotToken: 'bot-token' });
    project = Project.create({ name: 'Checkout Revamp', emoji: '💳', organizationId: org.getId() });

    await orgRepo.save(org);
    await projectRepo.save(project);
  });

  it('should send DMs to all admin members and mark report as delivered', async () => {
    const admin = Member.create({
      email: 'admin@acme.com',
      name: 'Admin User',
      slackUserId: 'U_ADMIN',
      avatarUrl: null,
      role: 'admin',
      organizationId: org.getId(),
    });
    await memberRepo.save(admin);

    const report = makeReport(project.getId(), org.getId());
    await reportRepo.save(report);

    await handler.execute(new DeliverReportCommand(report.getId()));

    const postedMessages = slackGateway.getPostedMessages();
    expect(postedMessages).toHaveLength(1);
    expect(postedMessages[0].channelId).toBe('dm_U_ADMIN');

    const saved = await reportRepo.findById(report.getId());
    expect(saved!.toJSON().slackDeliveredAt).not.toBeNull();
    expect(saved!.toJSON().slackMessageTs).not.toBeNull();
  });

  it('should send DMs to multiple admins', async () => {
    const admin1 = Member.create({
      email: 'cto@acme.com',
      name: 'CTO',
      slackUserId: 'U_CTO',
      avatarUrl: null,
      role: 'admin',
      organizationId: org.getId(),
    });
    const admin2 = Member.create({
      email: 'cpo@acme.com',
      name: 'CPO',
      slackUserId: 'U_CPO',
      avatarUrl: null,
      role: 'admin',
      organizationId: org.getId(),
    });
    const nonAdmin = Member.create({
      email: 'dev@acme.com',
      name: 'Developer',
      slackUserId: 'U_DEV',
      avatarUrl: null,
      role: 'member',
      organizationId: org.getId(),
    });

    await memberRepo.save(admin1);
    await memberRepo.save(admin2);
    await memberRepo.save(nonAdmin);

    const report = makeReport(project.getId(), org.getId());
    await reportRepo.save(report);

    await handler.execute(new DeliverReportCommand(report.getId()));

    const postedMessages = slackGateway.getPostedMessages();
    expect(postedMessages).toHaveLength(2);
    const channels = postedMessages.map((m) => m.channelId);
    expect(channels).toContain('dm_U_CTO');
    expect(channels).toContain('dm_U_CPO');
    expect(channels).not.toContain('dm_U_DEV');
  });

  it('should not fail if one DM fails — other admins still receive the report', async () => {
    const admin1 = Member.create({
      email: 'cto@acme.com',
      name: 'CTO',
      slackUserId: 'U_FAILING',
      avatarUrl: null,
      role: 'admin',
      organizationId: org.getId(),
    });
    const admin2 = Member.create({
      email: 'cpo@acme.com',
      name: 'CPO',
      slackUserId: 'U_OK',
      avatarUrl: null,
      role: 'admin',
      organizationId: org.getId(),
    });

    await memberRepo.save(admin1);
    await memberRepo.save(admin2);

    slackGateway.throwForDM('U_FAILING');

    const report = makeReport(project.getId(), org.getId());
    await reportRepo.save(report);

    await handler.execute(new DeliverReportCommand(report.getId()));

    const postedMessages = slackGateway.getPostedMessages();
    expect(postedMessages).toHaveLength(1);
    expect(postedMessages[0].channelId).toBe('dm_U_OK');
  });

  it('should throw if report does not exist', async () => {
    await expect(handler.execute(new DeliverReportCommand('non-existent'))).rejects.toThrow('Report not found');
  });

  it('should skip delivery and not mark report if no admins exist', async () => {
    const nonAdmin = Member.create({
      email: 'dev@acme.com',
      name: 'Developer',
      slackUserId: 'U_DEV',
      avatarUrl: null,
      role: 'member',
      organizationId: org.getId(),
    });
    await memberRepo.save(nonAdmin);

    const report = makeReport(project.getId(), org.getId());
    await reportRepo.save(report);

    await handler.execute(new DeliverReportCommand(report.getId()));

    expect(slackGateway.getPostedMessages()).toHaveLength(0);
    const saved = await reportRepo.findById(report.getId());
    expect(saved!.toJSON().slackDeliveredAt).toBeNull();
  });
});
