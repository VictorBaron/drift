import { RepositoryPort } from 'common/domain/repository-port';
import type { Channel } from '@/channels/domain/aggregates/channel.aggregate';

export abstract class ChannelRepository extends RepositoryPort<Channel> {
  abstract findById(id: string): Promise<Channel | null>;
  abstract findByAccountId(accountId: string): Promise<Channel[]>;
  abstract findBySlackChannelId({
    accountId,
    slackChannelId,
  }: {
    accountId: string;
    slackChannelId: string;
  }): Promise<Channel | null>;
  abstract save(channel: Channel): Promise<void>;
  abstract saveMany(channels: Channel[]): Promise<Channel[]>;
}
