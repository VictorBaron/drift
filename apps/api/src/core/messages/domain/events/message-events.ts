import { DomainEvent } from 'common/domain';

export class MessageCreatedEvent extends DomainEvent {
  readonly eventName = 'message.created';
  readonly messageId: string;

  constructor({ messageId }: { messageId: string }) {
    super();
    this.messageId = messageId;
  }
}

export class MessageScoredEvent extends DomainEvent {
  readonly eventName = 'message.scored';
  readonly messageId: string;
  readonly score: number;
  readonly reasoning: string;

  constructor({
    messageId,
    score,
    reasoning,
  }: {
    messageId: string;
    score: number;
    reasoning: string;
  }) {
    super();
    this.messageId = messageId;
    this.score = score;
    this.reasoning = reasoning;
  }
}
