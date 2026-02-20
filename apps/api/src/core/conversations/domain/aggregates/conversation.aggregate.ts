import { AggregateRoot } from 'common/domain';

import { ConversationImportedEvent } from '@/conversations/domain/events/conversation-events';

import type {
  ConversationJSON,
  ConversationProps,
  CreateConversationProps,
  UpdateConversationProps,
} from './conversation.types';

export class Conversation extends AggregateRoot {
  private accountId: string;
  private slackConversationId: string;
  private memberIds: string[];
  private isGroupDm: boolean;

  private constructor(props: ConversationProps) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
    this.accountId = props.accountId;
    this.slackConversationId = props.slackConversationId;
    this.memberIds = props.memberIds;
    this.isGroupDm = props.isGroupDm;
  }

  static create(props: CreateConversationProps): Conversation {
    const now = new Date();

    const conversation = new Conversation({
      id: crypto.randomUUID(),
      accountId: props.accountId,
      slackConversationId: props.slackConversationId,
      memberIds: props.memberIds,
      isGroupDm: props.isGroupDm,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    conversation.addDomainEvent(
      new ConversationImportedEvent({
        conversationId: conversation.id,
        accountId: conversation.accountId,
      }),
    );

    return conversation;
  }

  static reconstitute(props: ConversationProps): Conversation {
    return new Conversation(props);
  }

  update(props: UpdateConversationProps): void {
    this.memberIds = props.memberIds;
    this.updatedAt = new Date();
  }

  toJSON(): ConversationJSON {
    return {
      id: this.id,
      accountId: this.accountId,
      slackConversationId: this.slackConversationId,
      memberIds: this.memberIds,
      isGroupDm: this.isGroupDm,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
