import { Inject, Injectable, Logger } from '@nestjs/common';
import { SlackMessage } from '@/integrations/slack/domain/aggregates/slack-message.aggregate';
import type { SlackApiMessage } from '@/integrations/slack/domain/gateways/slack-api.gateway';
import { SLACK_API_GATEWAY, SlackApiGateway } from '@/integrations/slack/domain/gateways/slack-api.gateway';
import { SlackMessageRepository } from '@/integrations/slack/domain/repositories/slack-message.repository';
import { SlackFilterService } from '@/integrations/slack/domain/services/slack-filter.service';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';

export class IngestSlackMessagesCommand {
  constructor(
    public readonly projectId: string,
    public readonly organizationId: string,
    public readonly decryptedBotToken: string,
  ) {}
}

export interface IngestSlackMessagesResult {
  ingested: number;
  filtered: number;
}

@Injectable()
export class IngestSlackMessagesHandler {
  private readonly logger = new Logger(IngestSlackMessagesHandler.name);

  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly slackMessageRepo: SlackMessageRepository,
    @Inject(SLACK_API_GATEWAY) private readonly slackApiGateway: SlackApiGateway,
    private readonly slackFilterService: SlackFilterService,
  ) {}

  async execute(command: IngestSlackMessagesCommand): Promise<IngestSlackMessagesResult> {
    const { projectId, organizationId, decryptedBotToken } = command;

    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    let totalIngested = 0;
    let totalFiltered = 0;

    for (const channelId of project.getSlackChannelIds()) {
      const { ingested, filtered } = await this.ingestChannel({
        token: decryptedBotToken,
        channelId,
        projectId,
        organizationId,
      });
      totalIngested += ingested;
      totalFiltered += filtered;
    }

    this.logger.log(`Project ${projectId}: ingested=${totalIngested} filtered=${totalFiltered}`);
    return { ingested: totalIngested, filtered: totalFiltered };
  }

  private async ingestChannel({
    token,
    channelId,
    projectId,
    organizationId,
  }: {
    token: string;
    channelId: string;
    projectId: string;
    organizationId: string;
  }): Promise<{ ingested: number; filtered: number }> {
    const oldest = await this.resolveOldestTs(channelId);
    const channelMessages = await this.slackApiGateway.getChannelHistory(token, channelId, oldest);
    const allMessages = await this.collectMessagesWithReplies(token, channelId, channelMessages);
    const userNames = await this.resolveUserNames(token, allMessages);
    const newMessages = await this.buildNewMessages({ allMessages, userNames, channelId, projectId, organizationId });

    if (newMessages.length > 0) {
      await this.slackMessageRepo.saveMany(newMessages);
    }

    const filtered = newMessages.filter((m) => m.getIsFiltered()).length;
    return { ingested: newMessages.length, filtered };
  }

  private async resolveOldestTs(channelId: string): Promise<string> {
    const latestStored = await this.slackMessageRepo.findLatestByChannelId(channelId);
    return latestStored ? latestStored.getMessageTs() : String(Date.now() / 1000 - 7 * 86400);
  }

  private async collectMessagesWithReplies(
    token: string,
    channelId: string,
    channelMessages: SlackApiMessage[],
  ): Promise<Array<{ msg: SlackApiMessage; threadReplyCount: number }>> {
    const allMessages: Array<{ msg: SlackApiMessage; threadReplyCount: number }> = [];
    const seenTs = new Set<string>();

    for (const msg of channelMessages) {
      if (!seenTs.has(msg.ts)) {
        seenTs.add(msg.ts);
        allMessages.push({ msg, threadReplyCount: msg.replyCount });
      }

      if (msg.replyCount > 0) {
        const replies = await this.slackApiGateway.getThreadReplies(token, channelId, msg.ts);
        for (const reply of replies) {
          if (!seenTs.has(reply.ts)) {
            seenTs.add(reply.ts);
            allMessages.push({ msg: reply, threadReplyCount: msg.replyCount });
          }
        }
      }
    }

    return allMessages;
  }

  private async resolveUserNames(
    token: string,
    allMessages: Array<{ msg: SlackApiMessage; threadReplyCount: number }>,
  ): Promise<Map<string, string>> {
    const userNames = new Map<string, string>();

    for (const { msg } of allMessages) {
      if (!msg.isBot && !userNames.has(msg.userId)) {
        try {
          const user = await this.slackApiGateway.getUserInfo(token, msg.userId);
          userNames.set(msg.userId, user.realName || user.name);
        } catch {
          userNames.set(msg.userId, msg.userId);
        }
      }
    }

    return userNames;
  }

  private async buildNewMessages({
    allMessages,
    userNames,
    channelId,
    projectId,
    organizationId,
  }: {
    allMessages: Array<{ msg: SlackApiMessage; threadReplyCount: number }>;
    userNames: Map<string, string>;
    channelId: string;
    projectId: string;
    organizationId: string;
  }): Promise<SlackMessage[]> {
    const newMessages: SlackMessage[] = [];

    for (const { msg, threadReplyCount } of allMessages) {
      const existing = await this.slackMessageRepo.findByChannelAndTs(channelId, msg.ts);
      if (existing) continue;

      const message = SlackMessage.ingest({
        organizationId,
        projectId,
        channelId,
        messageTs: msg.ts,
        threadTs: msg.threadTs,
        userId: msg.userId,
        userName: msg.isBot ? '' : (userNames.get(msg.userId) ?? msg.userId),
        text: msg.text,
        isBot: msg.isBot,
        hasFiles: msg.hasFiles,
        reactionCount: msg.reactionCount,
        replyCount: msg.replyCount,
      });

      if (this.slackFilterService.shouldFilter(message, threadReplyCount)) {
        message.markFiltered();
      }

      newMessages.push(message);
    }

    return newMessages;
  }
}
