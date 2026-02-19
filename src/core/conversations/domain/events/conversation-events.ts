import { DomainEvent } from 'common/domain';

export class ConversationImportedEvent extends DomainEvent {
  readonly eventName = 'conversation.imported';
  readonly conversationId: string;
  readonly accountId: string;

  constructor({
    conversationId,
    accountId,
  }: { conversationId: string; accountId: string }) {
    super();
    this.conversationId = conversationId;
    this.accountId = accountId;
  }
}
