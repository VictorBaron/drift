import { RepositoryPort } from 'common/domain/repository-port';

import type { Message } from '@/messages/domain/aggregates';

export abstract class MessageRepository extends RepositoryPort<Message> {
  abstract findById(id: string): Promise<Message | null>;
  abstract findBySlackTs(slackTs: string): Promise<Message | null>;
}
