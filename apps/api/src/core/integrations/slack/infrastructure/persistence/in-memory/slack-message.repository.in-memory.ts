import { RepositoryInMemory } from 'common/domain/repository.in-memory';

import type { SlackMessage } from '@/integrations/slack/domain/aggregates/slack-message.aggregate';
import type { SlackMessageRepository } from '@/integrations/slack/domain/repositories/slack-message.repository';

export class SlackMessageRepositoryInMemory extends RepositoryInMemory<SlackMessage> implements SlackMessageRepository {
  findByChannelAndTs(channelId: string, messageTs: string): Promise<SlackMessage | null> {
    return this.find((msg) => msg.getChannelId() === channelId && msg.getMessageTs() === messageTs);
  }

  async findLatestByChannelId(channelId: string): Promise<SlackMessage | null> {
    const messages = await this.filter((msg) => msg.getChannelId() === channelId);
    if (messages.length === 0) return null;
    return messages.reduce((latest, msg) => (msg.getMessageTs() > latest.getMessageTs() ? msg : latest));
  }

  findByProjectId(projectId: string, since?: Date): Promise<SlackMessage[]> {
    return this.filter((msg) => {
      if (msg.getProjectId() !== projectId) return false;
      if (since) return msg.toJSON().ingestedAt >= since;
      return true;
    });
  }

  async saveMany(messages: SlackMessage[]): Promise<SlackMessage[]> {
    for (const message of messages) {
      await this.save(message);
    }
    return messages;
  }
}
