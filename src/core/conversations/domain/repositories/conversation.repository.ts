import { RepositoryPort } from 'common/domain/repository-port';

import type { Conversation } from '@/conversations/domain/aggregates/conversation.aggregate';

export abstract class ConversationRepository extends RepositoryPort<Conversation> {
  abstract findById(id: string): Promise<Conversation | null>;
  abstract findByAccountId(accountId: string): Promise<Conversation[]>;
  abstract findBySlackConversationId({
    accountId,
    slackConversationId,
  }: {
    accountId: string;
    slackConversationId: string;
  }): Promise<Conversation | null>;
  abstract save(conversation: Conversation): Promise<void>;
}
