import { RepositoryInMemory } from 'common/domain/repository.in-memory';
import type { Channel, ChannelRepository } from '@/channels/domain';

export class ChannelRepositoryInMemory extends RepositoryInMemory<Channel> implements ChannelRepository {
  async findByAccountId(accountId: string): Promise<Channel[]> {
    return this.filter((channel) => channel.toJSON().accountId === accountId);
  }

  async findBySlackChannelId({
    accountId,
    slackChannelId,
  }: {
    accountId: string;
    slackChannelId: string;
  }): Promise<Channel | null> {
    return (
      this.find((channel) => {
        const json = channel.toJSON();
        return json.accountId === accountId && json.slackChannelId === slackChannelId;
      }) ?? null
    );
  }

  async saveMany(channels: Channel[]): Promise<Channel[]> {
    for (const channel of channels) {
      await this.save(channel);
    }
    return channels;
  }
}
