import { RepositoryInMemory } from 'common/domain/repository.in-memory';

import type { Message, MessageRepository } from '@/messages/domain';

export class MessageRepositoryInMemory extends RepositoryInMemory<Message> implements MessageRepository {
  findBySlackTs(slackTs: string): Promise<Message | null> {
    return this.find((message) => message.toJSON().slackTs === slackTs) ?? null;
  }
}
