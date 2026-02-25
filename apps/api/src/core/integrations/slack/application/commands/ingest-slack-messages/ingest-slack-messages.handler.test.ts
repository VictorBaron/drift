import { Test } from '@nestjs/testing';
import type { SlackMessageJSON } from '@/integrations/slack/domain/aggregates/slack-message.aggregate';
import { SlackMessage } from '@/integrations/slack/domain/aggregates/slack-message.aggregate';
import { SLACK_API_GATEWAY } from '@/integrations/slack/domain/gateways/slack-api.gateway';
import { SlackMessageRepository } from '@/integrations/slack/domain/repositories/slack-message.repository';
import { SlackFilterService } from '@/integrations/slack/domain/services/slack-filter.service';
import { FakeSlackApiGateway } from '@/integrations/slack/infrastructure/gateways/fake-slack-api.gateway';
import { SlackMessageRepositoryInMemory } from '@/integrations/slack/infrastructure/persistence/in-memory/slack-message.repository.in-memory';
import { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ProjectRepositoryInMemory } from '@/projects/infrastructure/persistence/in-memory/project.repository.in-memory';

import { IngestSlackMessagesCommand, IngestSlackMessagesHandler } from './ingest-slack-messages.handler';

const BOT_TOKEN = 'test-bot-token';
const ORG_ID = 'org-1';
const CHANNEL_ID = 'C_GENERAL';

// Recent timestamps (within last hour) so they pass the 7-days-ago oldest filter
const BASE_TS = Math.floor(Date.now() / 1000) - 3600;
function rts(offset: number): string {
  return `${BASE_TS + offset}.000000`;
}

function makeApiMessage(
  ts: string,
  overrides: Partial<{
    userId: string;
    text: string;
    isBot: boolean;
    replyCount: number;
    threadTs: string | null;
    reactionCount: number;
    hasFiles: boolean;
    subtype: string | null;
  }> = {},
) {
  return {
    ts,
    threadTs: null,
    userId: 'U_ALICE',
    text: `Message at ${ts}`,
    isBot: false,
    hasFiles: false,
    reactionCount: 0,
    replyCount: 0,
    subtype: null,
    ...overrides,
  };
}

function makeApiUser(id: string, name: string) {
  return { id, name, realName: name, email: null, avatarUrl: null, isBot: false };
}

describe('IngestSlackMessages', () => {
  let handler: IngestSlackMessagesHandler;
  let projectRepo: ProjectRepositoryInMemory;
  let messageRepo: SlackMessageRepositoryInMemory;
  let slackGateway: FakeSlackApiGateway;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        IngestSlackMessagesHandler,
        { provide: ProjectRepository, useClass: ProjectRepositoryInMemory },
        { provide: SlackMessageRepository, useClass: SlackMessageRepositoryInMemory },
        { provide: SLACK_API_GATEWAY, useClass: FakeSlackApiGateway },
        { provide: SlackFilterService, useValue: { shouldFilter: () => false } },
      ],
    }).compile();

    handler = module.get<IngestSlackMessagesHandler>(IngestSlackMessagesHandler);
    projectRepo = module.get<ProjectRepositoryInMemory>(ProjectRepository);
    messageRepo = module.get<SlackMessageRepositoryInMemory>(SlackMessageRepository);
    slackGateway = module.get<FakeSlackApiGateway>(SLACK_API_GATEWAY);

    projectRepo.clear();
    messageRepo.clear();
    slackGateway.clear();
  });

  describe('when project has no slack channels', () => {
    it('should return zero counts', async () => {
      const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId: ORG_ID });
      await projectRepo.save(project);

      const command = new IngestSlackMessagesCommand(project.getId(), ORG_ID, BOT_TOKEN);
      const result = await handler.execute(command);

      expect(result).toEqual({ ingested: 0, filtered: 0 });
    });
  });

  describe('when project has slack channels with messages', () => {
    it('should ingest new messages from project channels', async () => {
      const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId: ORG_ID });
      project.addSlackChannel(CHANNEL_ID);
      await projectRepo.save(project);

      slackGateway.seedUser(makeApiUser('U_ALICE', 'Alice'));
      slackGateway.seedChannelMessages(CHANNEL_ID, [makeApiMessage(rts(1)), makeApiMessage(rts(2))]);

      const command = new IngestSlackMessagesCommand(project.getId(), ORG_ID, BOT_TOKEN);
      const result = await handler.execute(command);

      expect(result.ingested).toBe(2);

      const stored = await messageRepo.findByProjectId(project.getId());
      expect(stored).toHaveLength(2);
      expect(stored.map((m) => m.getMessageTs()).sort()).toEqual([rts(1), rts(2)].sort());
    });

    it('should fetch thread replies for messages with replyCount greater than zero', async () => {
      const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId: ORG_ID });
      project.addSlackChannel(CHANNEL_ID);
      await projectRepo.save(project);

      slackGateway.seedUser(makeApiUser('U_ALICE', 'Alice'));
      slackGateway.seedUser(makeApiUser('U_BOB', 'Bob'));

      const parentTs = rts(10);
      slackGateway.seedChannelMessages(CHANNEL_ID, [makeApiMessage(parentTs, { replyCount: 2 })]);
      slackGateway.seedThreadReplies(parentTs, [
        makeApiMessage(rts(11), { userId: 'U_BOB', threadTs: parentTs }),
        makeApiMessage(rts(12), { userId: 'U_BOB', threadTs: parentTs }),
      ]);

      const command = new IngestSlackMessagesCommand(project.getId(), ORG_ID, BOT_TOKEN);
      const result = await handler.execute(command);

      expect(result.ingested).toBe(3);

      const stored = await messageRepo.findByProjectId(project.getId());
      expect(stored).toHaveLength(3);
    });

    it('should not re-ingest messages that are already stored', async () => {
      const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId: ORG_ID });
      project.addSlackChannel(CHANNEL_ID);
      await projectRepo.save(project);

      const existingTs = '1700000001.000000';
      const existingMessage = SlackMessage.ingest({
        organizationId: ORG_ID,
        projectId: project.getId(),
        channelId: CHANNEL_ID,
        messageTs: existingTs,
        threadTs: null,
        userId: 'U_ALICE',
        userName: 'Alice',
        text: 'already stored',
        isBot: false,
        hasFiles: false,
        reactionCount: 0,
        replyCount: 0,
      });
      await messageRepo.save(existingMessage);

      slackGateway.seedUser(makeApiUser('U_ALICE', 'Alice'));
      slackGateway.seedUser(makeApiUser('U_BOB', 'Bob'));
      slackGateway.seedChannelMessages(CHANNEL_ID, [
        makeApiMessage(existingTs),
        makeApiMessage('1700000002.000000', { userId: 'U_BOB' }),
      ]);

      const command = new IngestSlackMessagesCommand(project.getId(), ORG_ID, BOT_TOKEN);
      const result = await handler.execute(command);

      expect(result.ingested).toBe(1);

      const stored = await messageRepo.findByProjectId(project.getId());
      expect(stored).toHaveLength(2);
    });
  });

  describe('oldest timestamp selection', () => {
    it('should use 7 days ago as oldest when no messages exist for the channel', async () => {
      const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId: ORG_ID });
      project.addSlackChannel(CHANNEL_ID);
      await projectRepo.save(project);

      const sevenDaysAgoSeconds = Date.now() / 1000 - 7 * 86400;

      slackGateway.seedUser(makeApiUser('U_ALICE', 'Alice'));
      // Seed a message with a ts just before 7 days ago — should NOT be returned
      const oldTs = String(sevenDaysAgoSeconds - 3600);
      // Seed a message with a ts just after 7 days ago — should be returned
      const recentTs = String(sevenDaysAgoSeconds + 3600);
      slackGateway.seedChannelMessages(CHANNEL_ID, [makeApiMessage(oldTs), makeApiMessage(recentTs)]);

      const command = new IngestSlackMessagesCommand(project.getId(), ORG_ID, BOT_TOKEN);
      const result = await handler.execute(command);

      expect(result.ingested).toBe(1);
      const stored = await messageRepo.findByProjectId(project.getId());
      expect(stored[0].getMessageTs()).toBe(recentTs);
    });

    it('should use the most recent stored message ts as oldest for incremental sync', async () => {
      const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId: ORG_ID });
      project.addSlackChannel(CHANNEL_ID);
      await projectRepo.save(project);

      const latestStoredTs = '1700000050.000000';
      const existingMessage = SlackMessage.ingest({
        organizationId: ORG_ID,
        projectId: project.getId(),
        channelId: CHANNEL_ID,
        messageTs: latestStoredTs,
        threadTs: null,
        userId: 'U_ALICE',
        userName: 'Alice',
        text: 'already stored',
        isBot: false,
        hasFiles: false,
        reactionCount: 0,
        replyCount: 0,
      });
      await messageRepo.save(existingMessage);

      slackGateway.seedUser(makeApiUser('U_ALICE', 'Alice'));
      slackGateway.seedUser(makeApiUser('U_BOB', 'Bob'));
      // Message before the latest stored ts — should be excluded by the gateway's filter
      slackGateway.seedChannelMessages(CHANNEL_ID, [
        makeApiMessage('1700000040.000000'),
        makeApiMessage(latestStoredTs),
        makeApiMessage('1700000060.000000', { userId: 'U_BOB' }),
      ]);

      const command = new IngestSlackMessagesCommand(project.getId(), ORG_ID, BOT_TOKEN);
      const result = await handler.execute(command);

      // Only the new message after the cursor should be ingested
      expect(result.ingested).toBe(1);
      const stored = await messageRepo.findByProjectId(project.getId());
      const timestamps = stored.map((m) => m.getMessageTs()).sort();
      expect(timestamps).toContain('1700000060.000000');
    });
  });

  describe('filtering', () => {
    it('should mark messages as filtered when filter service returns true', async () => {
      const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId: ORG_ID });
      project.addSlackChannel(CHANNEL_ID);

      const filterModule = await Test.createTestingModule({
        providers: [
          IngestSlackMessagesHandler,
          { provide: ProjectRepository, useClass: ProjectRepositoryInMemory },
          { provide: SlackMessageRepository, useClass: SlackMessageRepositoryInMemory },
          { provide: SLACK_API_GATEWAY, useClass: FakeSlackApiGateway },
          { provide: SlackFilterService, useValue: { shouldFilter: () => true } },
        ],
      }).compile();

      const filterHandler = filterModule.get<IngestSlackMessagesHandler>(IngestSlackMessagesHandler);
      const filterProjectRepo = filterModule.get<ProjectRepositoryInMemory>(ProjectRepository);
      const filterMessageRepo = filterModule.get<SlackMessageRepositoryInMemory>(SlackMessageRepository);
      const filterGateway = filterModule.get<FakeSlackApiGateway>(SLACK_API_GATEWAY);

      await filterProjectRepo.save(project);
      filterGateway.seedUser(makeApiUser('U_ALICE', 'Alice'));
      filterGateway.seedChannelMessages(CHANNEL_ID, [makeApiMessage(rts(1)), makeApiMessage(rts(2))]);

      const command = new IngestSlackMessagesCommand(project.getId(), ORG_ID, BOT_TOKEN);
      const result = await filterHandler.execute(command);

      expect(result.ingested).toBe(2);
      expect(result.filtered).toBe(2);

      const stored = await filterMessageRepo.findByProjectId(project.getId());
      expect(stored.every((m) => m.getIsFiltered())).toBe(true);
    });

    it('should pass the message reply count as threadReplyCount for top-level messages', async () => {
      const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId: ORG_ID });
      project.addSlackChannel(CHANNEL_ID);

      const capturedCalls: Array<{ messageTs: string; threadReplyCount: number }> = [];
      const trackingFilter = {
        shouldFilter: (message: SlackMessage, threadReplyCount: number) => {
          capturedCalls.push({ messageTs: message.getMessageTs(), threadReplyCount });
          return false;
        },
      };

      const trackingModule = await Test.createTestingModule({
        providers: [
          IngestSlackMessagesHandler,
          { provide: ProjectRepository, useClass: ProjectRepositoryInMemory },
          { provide: SlackMessageRepository, useClass: SlackMessageRepositoryInMemory },
          { provide: SLACK_API_GATEWAY, useClass: FakeSlackApiGateway },
          { provide: SlackFilterService, useValue: trackingFilter },
        ],
      }).compile();

      const trackingHandler = trackingModule.get<IngestSlackMessagesHandler>(IngestSlackMessagesHandler);
      const trackingProjectRepo = trackingModule.get<ProjectRepositoryInMemory>(ProjectRepository);
      const trackingGateway = trackingModule.get<FakeSlackApiGateway>(SLACK_API_GATEWAY);

      await trackingProjectRepo.save(project);
      trackingGateway.seedUser(makeApiUser('U_ALICE', 'Alice'));
      trackingGateway.seedUser(makeApiUser('U_BOB', 'Bob'));

      const parentTs = rts(10);
      const replyTs = rts(11);
      trackingGateway.seedChannelMessages(CHANNEL_ID, [makeApiMessage(parentTs, { replyCount: 3 })]);
      trackingGateway.seedThreadReplies(parentTs, [makeApiMessage(replyTs, { userId: 'U_BOB', threadTs: parentTs })]);

      await trackingHandler.execute(new IngestSlackMessagesCommand(project.getId(), ORG_ID, BOT_TOKEN));

      const parentCall = capturedCalls.find((c) => c.messageTs === parentTs);
      const replyCall = capturedCalls.find((c) => c.messageTs === replyTs);

      expect(parentCall?.threadReplyCount).toBe(3);
      expect(replyCall?.threadReplyCount).toBe(3);
    });
  });

  describe('bot messages', () => {
    it('should use empty string as userName for bot messages without calling getUserInfo', async () => {
      const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId: ORG_ID });
      project.addSlackChannel(CHANNEL_ID);
      await projectRepo.save(project);

      // No user seeded — if getUserInfo is called for the bot it will throw
      slackGateway.seedChannelMessages(CHANNEL_ID, [makeApiMessage(rts(1), { isBot: true, userId: 'B_BOT' })]);

      const command = new IngestSlackMessagesCommand(project.getId(), ORG_ID, BOT_TOKEN);
      const result = await handler.execute(command);

      expect(result.ingested).toBe(1);

      const stored = await messageRepo.findByProjectId(project.getId());
      expect(stored[0].toJSON()).toMatchObject<Partial<SlackMessageJSON>>({
        isBot: true,
        userName: '',
      });
    });
  });

  describe('result counts', () => {
    it('should return correct ingested and filtered counts across multiple channels', async () => {
      const CHANNEL_B = 'C_BACKEND';

      const project = Project.create({ name: 'My Project', emoji: '🚀', organizationId: ORG_ID });
      project.addSlackChannel(CHANNEL_ID);
      project.addSlackChannel(CHANNEL_B);

      const ts1 = rts(1);
      const ts2 = rts(2);
      const ts3 = rts(3);
      const ts4 = rts(4);
      const ts5 = rts(5);

      const filterCounts: Record<string, boolean> = {
        [ts1]: false,
        [ts2]: true,
        [ts3]: false,
        [ts4]: true,
        [ts5]: true,
      };

      const selectiveFilter = {
        shouldFilter: (message: SlackMessage) => filterCounts[message.getMessageTs()] ?? false,
      };

      const countModule = await Test.createTestingModule({
        providers: [
          IngestSlackMessagesHandler,
          { provide: ProjectRepository, useClass: ProjectRepositoryInMemory },
          { provide: SlackMessageRepository, useClass: SlackMessageRepositoryInMemory },
          { provide: SLACK_API_GATEWAY, useClass: FakeSlackApiGateway },
          { provide: SlackFilterService, useValue: selectiveFilter },
        ],
      }).compile();

      const countHandler = countModule.get<IngestSlackMessagesHandler>(IngestSlackMessagesHandler);
      const countProjectRepo = countModule.get<ProjectRepositoryInMemory>(ProjectRepository);
      const countGateway = countModule.get<FakeSlackApiGateway>(SLACK_API_GATEWAY);

      await countProjectRepo.save(project);
      countGateway.seedUser(makeApiUser('U_ALICE', 'Alice'));
      countGateway.seedChannelMessages(CHANNEL_ID, [makeApiMessage(ts1), makeApiMessage(ts2)]);
      countGateway.seedChannelMessages(CHANNEL_B, [makeApiMessage(ts3), makeApiMessage(ts4), makeApiMessage(ts5)]);

      const command = new IngestSlackMessagesCommand(project.getId(), ORG_ID, BOT_TOKEN);
      const result = await countHandler.execute(command);

      expect(result.ingested).toBe(5);
      expect(result.filtered).toBe(3);
    });
  });
});
