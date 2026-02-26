import { Test } from '@nestjs/testing';

import { Organization } from '@/accounts/domain/aggregates/organization.aggregate';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { OrganizationRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/organization.repository.in-memory';
import { SLACK_API_GATEWAY } from '@/integrations/slack/domain/gateways/slack-api.gateway';
import { SlackMessageRepository } from '@/integrations/slack/domain/repositories/slack-message.repository';
import { IngestSlackMessagesService } from '@/integrations/slack/domain/services/ingest-slack-messages/ingest-slack-messages.service';
import { SlackFilterService } from '@/integrations/slack/domain/services/slack-filter.service';
import { FakeSlackApiGateway } from '@/integrations/slack/infrastructure/gateways/fake-slack-api.gateway';
import { SlackMessageRepositoryInMemory } from '@/integrations/slack/infrastructure/persistence/in-memory/slack-message.repository.in-memory';
import { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ProjectRepositoryInMemory } from '@/projects/infrastructure/persistence/in-memory/project.repository.in-memory';

import { IngestOrganizationSlackCommand, IngestOrganizationSlackService } from './ingest-organization-slack.service';

const BOT_TOKEN = 'xoxb-test-token';
const BASE_TS = Math.floor(Date.now() / 1000) - 3600;

function rts(offset: number): string {
  return `${BASE_TS + offset}.000000`;
}

function makeOrg(): Organization {
  return Organization.create({ name: 'Acme', slackTeamId: 'T_ACME', slackBotToken: BOT_TOKEN });
}

function makeProjectWithChannel(organizationId: string, channelId: string): Project {
  const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId });
  project.addSlackChannel(channelId);
  return project;
}

function makeApiMessage(ts: string) {
  return {
    ts,
    threadTs: null,
    userId: 'U_ALICE',
    text: `msg ${ts}`,
    isBot: false,
    hasFiles: false,
    reactionCount: 0,
    replyCount: 0,
    subtype: null,
  };
}

describe('IngestOrganizationSlack', () => {
  let service: IngestOrganizationSlackService;
  let orgRepo: OrganizationRepositoryInMemory;
  let projectRepo: ProjectRepositoryInMemory;
  let messageRepo: SlackMessageRepositoryInMemory;
  let slackGateway: FakeSlackApiGateway;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        IngestOrganizationSlackService,
        IngestSlackMessagesService,
        SlackFilterService,
        { provide: OrganizationRepository, useClass: OrganizationRepositoryInMemory },
        { provide: ProjectRepository, useClass: ProjectRepositoryInMemory },
        { provide: SlackMessageRepository, useClass: SlackMessageRepositoryInMemory },
        { provide: SLACK_API_GATEWAY, useClass: FakeSlackApiGateway },
      ],
    }).compile();

    service = module.get<IngestOrganizationSlackService>(IngestOrganizationSlackService);
    orgRepo = module.get<OrganizationRepositoryInMemory>(OrganizationRepository);
    projectRepo = module.get<ProjectRepositoryInMemory>(ProjectRepository);
    messageRepo = module.get<SlackMessageRepositoryInMemory>(SlackMessageRepository);
    slackGateway = module.get<FakeSlackApiGateway>(SLACK_API_GATEWAY);

    orgRepo.clear();
    projectRepo.clear();
    messageRepo.clear();
    slackGateway.clear();
  });

  describe('when the organization does not exist', () => {
    it('should throw an error', async () => {
      await expect(service.execute(new IngestOrganizationSlackCommand('non-existent-org-id'))).rejects.toThrow(
        'Organization not found',
      );
    });
  });

  describe('when the organization has no active projects', () => {
    it('should return zero counts', async () => {
      const org = makeOrg();
      await orgRepo.save(org);

      const result = await service.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(result).toEqual({ ingested: 0, filtered: 0 });
    });
  });

  describe('when the organization has active projects without Slack channels', () => {
    it('should skip those projects and return zero counts', async () => {
      const org = makeOrg();
      await orgRepo.save(org);
      await projectRepo.save(Project.create({ name: 'P1', emoji: '🚀', organizationId: org.getId() }));

      const result = await service.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(result).toEqual({ ingested: 0, filtered: 0 });
    });
  });

  describe('when the organization has inactive projects with Slack channels', () => {
    it('should skip those projects', async () => {
      const org = makeOrg();
      await orgRepo.save(org);
      const project = makeProjectWithChannel(org.getId(), 'C_ONE');
      project.deactivate();
      await projectRepo.save(project);

      const result = await service.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(result).toEqual({ ingested: 0, filtered: 0 });
    });
  });

  describe('when the organization has active projects with Slack channels', () => {
    it('should ingest messages from all qualifying projects', async () => {
      const org = makeOrg();
      await orgRepo.save(org);

      const p1 = makeProjectWithChannel(org.getId(), 'C_ONE');
      const p2 = makeProjectWithChannel(org.getId(), 'C_TWO');
      await projectRepo.save(p1);
      await projectRepo.save(p2);

      slackGateway.seedUser({
        id: 'U_ALICE',
        name: 'Alice',
        realName: 'Alice',
        email: null,
        avatarUrl: null,
        isBot: false,
      });
      slackGateway.seedChannelMessages('C_ONE', [makeApiMessage(rts(1)), makeApiMessage(rts(2))]);
      slackGateway.seedChannelMessages('C_TWO', [makeApiMessage(rts(3))]);

      const result = await service.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(result).toEqual({ ingested: 3, filtered: 0 });
      expect(await messageRepo.findByProjectId(p1.getId())).toHaveLength(2);
      expect(await messageRepo.findByProjectId(p2.getId())).toHaveLength(1);
    });
  });

  describe('when one project ingestion fails', () => {
    it('should continue processing remaining projects', async () => {
      const org = makeOrg();
      await orgRepo.save(org);

      const p1 = makeProjectWithChannel(org.getId(), 'C_ONE');
      const p2 = makeProjectWithChannel(org.getId(), 'C_TWO');
      await projectRepo.save(p1);
      await projectRepo.save(p2);

      slackGateway.seedUser({
        id: 'U_ALICE',
        name: 'Alice',
        realName: 'Alice',
        email: null,
        avatarUrl: null,
        isBot: false,
      });
      slackGateway.throwForChannel('C_ONE');
      slackGateway.seedChannelMessages('C_TWO', [makeApiMessage(rts(1))]);

      const result = await service.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(result).toEqual({ ingested: 1, filtered: 0 });
      expect(await messageRepo.findByProjectId(p2.getId())).toHaveLength(1);
    });
  });
});
