import { Channel, type ChannelProps } from '@/channels/domain';

export class ChannelFactory {
  static create(overrides?: Partial<ChannelProps>): Channel {
    return Channel.reconstitute({
      id: 'channelId',
      accountId: 'accountId',
      slackChannelId: 'C_TEST',
      name: 'general',
      topic: 'General discussion',
      purpose: 'Company-wide announcements',
      isPrivate: false,
      isArchived: false,
      memberIds: ['memberId'],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      deletedAt: null,
      ...overrides,
    });
  }
}
