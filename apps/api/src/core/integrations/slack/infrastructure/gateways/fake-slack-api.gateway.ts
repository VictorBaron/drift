import { Injectable } from '@nestjs/common';

import {
  type SlackApiChannel,
  SlackApiGateway,
  type SlackApiMessage,
  type SlackApiPostedMessage,
  type SlackApiUser,
} from '../../domain/gateways/slack-api.gateway';

@Injectable()
export class FakeSlackApiGateway extends SlackApiGateway {
  private channelMessages: Map<string, SlackApiMessage[]> = new Map();
  private threadReplies: Map<string, SlackApiMessage[]> = new Map();
  private channels: SlackApiChannel[] = [];
  private users: Map<string, SlackApiUser> = new Map();
  private postedMessages: SlackApiPostedMessage[] = [];
  private throwingChannels: Set<string> = new Set();

  seedChannelMessages(channelId: string, messages: SlackApiMessage[]): void {
    this.channelMessages.set(channelId, messages);
  }

  seedThreadReplies(threadTs: string, replies: SlackApiMessage[]): void {
    this.threadReplies.set(threadTs, replies);
  }

  seedChannels(channels: SlackApiChannel[]): void {
    this.channels = channels;
  }

  seedUser(user: SlackApiUser): void {
    this.users.set(user.id, user);
  }

  getPostedMessages(): SlackApiPostedMessage[] {
    return this.postedMessages;
  }

  throwForChannel(channelId: string): void {
    this.throwingChannels.add(channelId);
  }

  clear(): void {
    this.channelMessages.clear();
    this.threadReplies.clear();
    this.channels = [];
    this.users.clear();
    this.postedMessages = [];
    this.throwingChannels.clear();
  }

  async getChannelHistory(
    _token: string,
    channelId: string,
    oldest?: string,
    latest?: string,
  ): Promise<SlackApiMessage[]> {
    if (this.throwingChannels.has(channelId)) {
      throw new Error(`Simulated gateway failure for channel ${channelId}`);
    }

    const messages = this.channelMessages.get(channelId) ?? [];

    return messages.filter((msg) => {
      if (oldest && msg.ts < oldest) return false;
      if (latest && msg.ts > latest) return false;
      return true;
    });
  }

  async getThreadReplies(_token: string, _channelId: string, threadTs: string): Promise<SlackApiMessage[]> {
    return this.threadReplies.get(threadTs) ?? [];
  }

  async listChannels(_token: string): Promise<SlackApiChannel[]> {
    return this.channels;
  }

  async getUserInfo(_token: string, userId: string): Promise<SlackApiUser> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User not found in fake gateway: ${userId}`);
    }
    return user;
  }

  async postMessage(_token: string, channelId: string, _blocks: unknown[]): Promise<SlackApiPostedMessage> {
    const message: SlackApiPostedMessage = {
      ts: String(Date.now()),
      channelId,
    };
    this.postedMessages.push(message);
    return message;
  }

  async postDM(_token: string, userId: string, blocks: unknown[]): Promise<SlackApiPostedMessage> {
    return this.postMessage(_token, `dm_${userId}`, blocks);
  }
}
