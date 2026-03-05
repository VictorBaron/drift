import { Injectable, Logger } from '@nestjs/common';
import type { KnownBlock } from '@slack/types';
import { WebClient } from '@slack/web-api';

import {
  type SlackApiChannel,
  SlackApiGateway,
  type SlackApiMessage,
  type SlackApiPostedMessage,
  type SlackApiUser,
} from '../../domain/gateways/slack-api.gateway';

const USER_CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedUser {
  user: SlackApiUser;
  cachedAt: number;
}

@Injectable()
export class WebApiSlackGateway extends SlackApiGateway {
  private readonly logger = new Logger(WebApiSlackGateway.name);
  private readonly userCache = new Map<string, CachedUser>();

  private buildClient(token: string): WebClient {
    return new WebClient(token, {
      retryConfig: {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 30_000,
      },
    });
  }

  async getChannelHistory(
    token: string,
    channelId: string,
    oldest?: string,
    latest?: string,
  ): Promise<SlackApiMessage[]> {
    const client = this.buildClient(token);
    const messages: SlackApiMessage[] = [];
    let cursor: string | undefined;

    do {
      const response = await client.conversations.history({
        channel: channelId,
        oldest,
        latest,
        limit: 200,
        cursor,
      });

      for (const msg of response.messages ?? []) {
        messages.push(this.mapMessage(msg));
      }

      cursor = response.response_metadata?.next_cursor || undefined;
    } while (cursor);

    this.logger.debug(`Fetched ${messages.length} messages from channel ${channelId}`);
    return messages;
  }

  async getThreadReplies(token: string, channelId: string, threadTs: string): Promise<SlackApiMessage[]> {
    const client = this.buildClient(token);
    const messages: SlackApiMessage[] = [];
    let cursor: string | undefined;

    do {
      const response = await client.conversations.replies({
        channel: channelId,
        ts: threadTs,
        limit: 200,
        cursor,
      });

      for (const msg of response.messages ?? []) {
        messages.push(this.mapMessage(msg));
      }

      cursor = response.response_metadata?.next_cursor || undefined;
    } while (cursor);

    // skip the first message (the thread parent)
    return messages.slice(1);
  }

  async listChannels(token: string): Promise<SlackApiChannel[]> {
    const client = this.buildClient(token);
    const channels: SlackApiChannel[] = [];
    let cursor: string | undefined;

    do {
      const response = await client.conversations.list({
        exclude_archived: true,
        types: 'public_channel,private_channel',
        limit: 200,
        cursor,
      });

      for (const ch of response.channels ?? []) {
        if (ch.id && ch.name) {
          channels.push({
            id: ch.id,
            name: ch.name,
            isPrivate: ch.is_private ?? false,
            isMember: ch.is_member ?? false,
          });
        }
      }

      cursor = response.response_metadata?.next_cursor || undefined;
    } while (cursor);

    return channels;
  }

  async getUserInfo(token: string, userId: string): Promise<SlackApiUser> {
    const cached = this.userCache.get(userId);
    if (cached && Date.now() - cached.cachedAt < USER_CACHE_TTL_MS) {
      return cached.user;
    }

    const client = this.buildClient(token);
    const response = await client.users.info({ user: userId });
    const user = response.user;

    if (!user?.id) {
      throw new Error(`User not found: ${userId}`);
    }

    const result: SlackApiUser = {
      id: user.id,
      name: user.name ?? '',
      realName: user.profile?.real_name ?? user.name ?? '',
      email: user.profile?.email ?? null,
      avatarUrl: user.profile?.image_192 ?? null,
      isBot: user.is_bot ?? false,
    };

    this.userCache.set(userId, { user: result, cachedAt: Date.now() });
    return result;
  }

  async postMessage(token: string, channelId: string, blocks: unknown[]): Promise<SlackApiPostedMessage> {
    const client = this.buildClient(token);
    const response = await client.chat.postMessage({
      channel: channelId,
      blocks: blocks as KnownBlock[],
    });

    return {
      ts: response.ts ?? '',
      channelId: response.channel ?? channelId,
    };
  }

  async postDM(token: string, userId: string, blocks: unknown[]): Promise<SlackApiPostedMessage> {
    const client = this.buildClient(token);
    const dmResponse = await client.conversations.open({ users: userId });
    const channelId = dmResponse.channel?.id;

    if (!channelId) {
      throw new Error(`Failed to open DM with user: ${userId}`);
    }

    return this.postMessage(token, channelId, blocks);
  }

  async publishAppHome(token: string, userId: string, view: unknown): Promise<void> {
    const client = this.buildClient(token);
    await client.views.publish({
      user_id: userId,
      // biome-ignore lint/suspicious/noExplicitAny: Slack view type
      view: view as any,
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: Slack API message type is complex
  private mapMessage(msg: Record<string, any>): SlackApiMessage {
    const reactions: { count: number }[] = msg.reactions ?? [];
    const reactionCount = reactions.reduce((sum, r) => sum + (r.count ?? 0), 0);

    return {
      ts: msg.ts ?? '',
      threadTs: msg.thread_ts ?? null,
      userId: msg.user ?? msg.bot_id ?? '',
      text: msg.text ?? '',
      isBot: Boolean(msg.bot_id) || msg.subtype === 'bot_message',
      hasFiles: Array.isArray(msg.files) && msg.files.length > 0,
      reactionCount,
      replyCount: msg.reply_count ?? 0,
      subtype: msg.subtype ?? null,
    };
  }
}
