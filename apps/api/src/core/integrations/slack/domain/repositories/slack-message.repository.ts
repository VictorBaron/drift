import { RepositoryPort } from 'common/domain';

import type { SlackMessage } from '../aggregates/slack-message.aggregate';

export abstract class SlackMessageRepository extends RepositoryPort<SlackMessage> {
  abstract findByChannelAndTs(channelId: string, messageTs: string): Promise<SlackMessage | null>;
  abstract findLatestByChannelId(channelId: string): Promise<SlackMessage | null>;
  abstract findByProjectId(projectId: string, since?: Date): Promise<SlackMessage[]>;
  abstract saveMany(messages: SlackMessage[]): Promise<SlackMessage[]>;
}
