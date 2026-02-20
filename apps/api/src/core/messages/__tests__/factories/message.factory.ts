import { Message, type MessageProps } from '@/messages/domain';

export class MessageFactory {
  static create(overrides?: Partial<MessageProps>): Message {
    return Message.reconstitute({
      id: 'message-id',
      accountId: 'account-id',
      senderId: 'sender-id',
      slackTs: '1234567890.123456',
      slackChannelId: 'C_GENERAL',
      slackChannelType: 'channel',
      slackThreadTs: null,
      text: 'Hello world',
      urgencyScore: null,
      urgencyReasoning: null,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      deletedAt: null,
      ...overrides,
    });
  }
}
