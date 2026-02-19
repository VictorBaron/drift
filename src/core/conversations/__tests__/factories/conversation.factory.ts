import { Conversation, type ConversationProps } from '@/conversations/domain';

export class ConversationFactory {
  static create(overrides?: Partial<ConversationProps>): Conversation {
    return Conversation.reconstitute({
      id: 'conversationId',
      accountId: 'accountId',
      slackConversationId: 'D_TEST',
      memberIds: ['userId1', 'userId2'],
      isGroupDm: false,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      deletedAt: null,
      ...overrides,
    });
  }
}
