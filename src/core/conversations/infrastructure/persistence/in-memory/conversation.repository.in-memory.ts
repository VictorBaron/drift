import { RepositoryInMemory } from 'common/domain/repository.in-memory';

import type {
  Conversation,
  ConversationRepository,
} from '@/conversations/domain';

export class ConversationRepositoryInMemory
  extends RepositoryInMemory<Conversation>
  implements ConversationRepository
{
  async findByAccountId(accountId: string): Promise<Conversation[]> {
    return this.filter(
      (conversation) => conversation.toJSON().accountId === accountId,
    );
  }

  async findBySlackConversationId({
    accountId,
    slackConversationId,
  }: {
    accountId: string;
    slackConversationId: string;
  }): Promise<Conversation | null> {
    return (
      this.find((conversation) => {
        const json = conversation.toJSON();
        return (
          json.accountId === accountId &&
          json.slackConversationId === slackConversationId
        );
      }) ?? null
    );
  }
}
