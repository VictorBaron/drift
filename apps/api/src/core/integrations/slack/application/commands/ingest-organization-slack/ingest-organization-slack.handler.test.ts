import { Organization } from '@/accounts/domain/aggregates/organization.aggregate';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { OrganizationRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/organization.repository.in-memory';
import {
  IngestSlackMessagesCommand,
  IngestSlackMessagesHandler,
  type IngestSlackMessagesResult,
} from '@/integrations/slack/application/commands/ingest-slack-messages/ingest-slack-messages.handler';
import { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ProjectRepositoryInMemory } from '@/projects/infrastructure/persistence/in-memory/project.repository.in-memory';
import { IngestOrganizationSlackCommand, IngestOrganizationSlackHandler } from './ingest-organization-slack.handler';

const BOT_TOKEN = 'xoxb-test-token';
const ORG_NAME = 'Acme';
const SLACK_TEAM_ID = 'T_ACME';

function makeOrg(overrides: Partial<{ botToken: string }> = {}): Organization {
  return Organization.create({
    name: ORG_NAME,
    slackTeamId: SLACK_TEAM_ID,
    slackBotToken: overrides.botToken ?? BOT_TOKEN,
  });
}

function makeProjectWithChannels(organizationId: string, ...channelIds: string[]): Project {
  const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId });
  for (const channelId of channelIds) {
    project.addSlackChannel(channelId);
  }
  return project;
}

class FakeIngestSlackMessagesHandler {
  readonly calls: IngestSlackMessagesCommand[] = [];
  shouldThrowForProjectId: string | null = null;
  result: IngestSlackMessagesResult = { ingested: 2, filtered: 1 };

  async execute(command: IngestSlackMessagesCommand): Promise<IngestSlackMessagesResult> {
    if (this.shouldThrowForProjectId === command.projectId) {
      throw new Error(`Simulated failure for project ${command.projectId}`);
    }
    this.calls.push(command);
    return this.result;
  }
}

describe('IngestOrganizationSlack', () => {
  let handler: IngestOrganizationSlackHandler;
  let orgRepo: OrganizationRepositoryInMemory;
  let projectRepo: ProjectRepositoryInMemory;
  let fakeIngestHandler: FakeIngestSlackMessagesHandler;

  beforeEach(() => {
    orgRepo = new OrganizationRepositoryInMemory();
    projectRepo = new ProjectRepositoryInMemory();
    fakeIngestHandler = new FakeIngestSlackMessagesHandler();
    handler = new IngestOrganizationSlackHandler(
      orgRepo,
      projectRepo,
      fakeIngestHandler as unknown as IngestSlackMessagesHandler,
    );
  });

  describe('when the organization does not exist', () => {
    it('should throw an error', async () => {
      const command = new IngestOrganizationSlackCommand('non-existent-org-id');
      await expect(handler.execute(command)).rejects.toThrow('Organization not found');
    });
  });

  describe('when the organization has no active projects', () => {
    it('should return zero counts', async () => {
      const org = makeOrg();
      await orgRepo.save(org);

      const result = await handler.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(result).toEqual({ ingested: 0, filtered: 0 });
      expect(fakeIngestHandler.calls).toHaveLength(0);
    });
  });

  describe('when the organization has active projects without Slack channels', () => {
    it('should skip those projects and return zero counts', async () => {
      const org = makeOrg();
      await orgRepo.save(org);

      const project = Project.create({ name: 'P1', emoji: '🚀', organizationId: org.getId() });
      await projectRepo.save(project);

      const result = await handler.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(result).toEqual({ ingested: 0, filtered: 0 });
      expect(fakeIngestHandler.calls).toHaveLength(0);
    });
  });

  describe('when the organization has inactive projects with Slack channels', () => {
    it('should skip those projects', async () => {
      const org = makeOrg();
      await orgRepo.save(org);

      const project = makeProjectWithChannels(org.getId(), 'C_ONE');
      project.deactivate();
      await projectRepo.save(project);

      const result = await handler.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(result).toEqual({ ingested: 0, filtered: 0 });
      expect(fakeIngestHandler.calls).toHaveLength(0);
    });
  });

  describe('when the organization has active projects with Slack channels', () => {
    it('should call the ingest handler for each qualifying project', async () => {
      const org = makeOrg();
      await orgRepo.save(org);

      const p1 = makeProjectWithChannels(org.getId(), 'C_ONE');
      const p2 = makeProjectWithChannels(org.getId(), 'C_TWO');
      await projectRepo.save(p1);
      await projectRepo.save(p2);

      await handler.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(fakeIngestHandler.calls).toHaveLength(2);
      expect(fakeIngestHandler.calls.map((c) => c.projectId)).toEqual(expect.arrayContaining([p1.getId(), p2.getId()]));
    });

    it('should pass the organization bot token to each project ingestion', async () => {
      const org = makeOrg({ botToken: 'xoxb-secret' });
      await orgRepo.save(org);

      const project = makeProjectWithChannels(org.getId(), 'C_ONE');
      await projectRepo.save(project);

      await handler.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(fakeIngestHandler.calls[0].decryptedBotToken).toBe('xoxb-secret');
    });

    it('should pass the correct organizationId to each project ingestion', async () => {
      const org = makeOrg();
      await orgRepo.save(org);

      const project = makeProjectWithChannels(org.getId(), 'C_ONE');
      await projectRepo.save(project);

      await handler.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(fakeIngestHandler.calls[0].organizationId).toBe(org.getId());
    });

    it('should aggregate ingested and filtered counts across all projects', async () => {
      const org = makeOrg();
      await orgRepo.save(org);

      fakeIngestHandler.result = { ingested: 3, filtered: 1 };

      const p1 = makeProjectWithChannels(org.getId(), 'C_ONE');
      const p2 = makeProjectWithChannels(org.getId(), 'C_TWO');
      await projectRepo.save(p1);
      await projectRepo.save(p2);

      const result = await handler.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(result).toEqual({ ingested: 6, filtered: 2 });
    });
  });

  describe('when one project ingestion fails', () => {
    it('should continue processing remaining projects and accumulate partial counts', async () => {
      const org = makeOrg();
      await orgRepo.save(org);

      const p1 = makeProjectWithChannels(org.getId(), 'C_ONE');
      const p2 = makeProjectWithChannels(org.getId(), 'C_TWO');
      await projectRepo.save(p1);
      await projectRepo.save(p2);

      fakeIngestHandler.shouldThrowForProjectId = p1.getId();
      fakeIngestHandler.result = { ingested: 5, filtered: 2 };

      const result = await handler.execute(new IngestOrganizationSlackCommand(org.getId()));

      expect(fakeIngestHandler.calls).toHaveLength(1);
      expect(fakeIngestHandler.calls[0].projectId).toBe(p2.getId());
      expect(result).toEqual({ ingested: 5, filtered: 2 });
    });
  });
});
