import { GenericMessageEvent } from '@slack/types';
import { AggregateRoot } from 'common/domain';
import { MessageCreatedEvent, MessageScoredEvent } from '@/messages/domain/events';
import type { CreateMessageProps, MessageJSON, MessageProps } from './message.types';

export class Message extends AggregateRoot {
  private accountId: string;
  private senderId: string;
  private slackTs: string;
  private slackChannelId: string;
  private slackChannelType: GenericMessageEvent['channel_type'];
  private slackThreadTs: string | null;
  private text: string | null;
  private urgencyScore: number | null;
  private urgencyReasoning: string | null;

  private constructor(props: MessageProps) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
    this.accountId = props.accountId;
    this.senderId = props.senderId;
    this.slackTs = props.slackTs;
    this.slackChannelId = props.slackChannelId;
    this.slackChannelType = props.slackChannelType;
    this.slackThreadTs = props.slackThreadTs;
    this.text = props.text;
    this.urgencyScore = props.urgencyScore;
    this.urgencyReasoning = props.urgencyReasoning;
  }

  static create(props: CreateMessageProps): Message {
    const now = new Date();

    const message = new Message({
      id: crypto.randomUUID(),
      accountId: props.sender.getAccountId(),
      senderId: props.sender.getId(),
      slackTs: props.slackTs,
      slackChannelId: props.slackChannelId,
      slackChannelType: props.slackChannelType,
      slackThreadTs: props.slackThreadTs,
      text: props.text,
      urgencyScore: null,
      urgencyReasoning: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    message.addDomainEvent(new MessageCreatedEvent({ messageId: message.id }));

    return message;
  }

  static reconstitute(props: MessageProps): Message {
    return new Message(props);
  }

  isUrgent(): boolean {
    return this.urgencyScore === 5;
  }

  setUrgencyScore({ score, reasoning }: { score: number; reasoning: string }): void {
    this.urgencyScore = score;
    this.urgencyReasoning = reasoning;
    this.addDomainEvent(
      new MessageScoredEvent({
        messageId: this.id,
        score,
        reasoning,
      }),
    );
  }

  toJSON(): MessageJSON {
    return {
      id: this.id,
      accountId: this.accountId,
      senderId: this.senderId,
      slackTs: this.slackTs,
      slackChannelId: this.slackChannelId,
      slackChannelType: this.slackChannelType,
      slackThreadTs: this.slackThreadTs,
      text: this.text,
      urgencyScore: this.urgencyScore,
      urgencyReasoning: this.urgencyReasoning,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
