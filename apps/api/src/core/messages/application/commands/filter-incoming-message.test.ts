import { Test } from '@nestjs/testing';
import { GenericMessageEvent } from '@slack/web-api';
import { AccountRepository, MemberRepository } from '@/accounts';
import { AccountFactory } from '@/accounts/__tests__/factories/account.factory';
import { MemberFactory } from '@/accounts/__tests__/factories/member.factory';
import { AccountRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/account.repository.in-memory';
import { MemberRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/member.repository.in-memory';
import { ChannelFactory } from '@/channels/__tests__/factories/channel.factory';
import { ChannelRepository } from '@/channels/domain';
import { ChannelRepositoryInMemory } from '@/channels/infrastructure/persistence/in-memory/channel.repository.in-memory';
import { ConversationFactory } from '@/conversations/__tests__/factories/conversation.factory';
import { ConversationRepository } from '@/conversations/domain';
import { ConversationRepositoryInMemory } from '@/conversations/infrastructure/persistence/in-memory/conversation.repository.in-memory';
import {
  Message,
  MessageCreatedEvent,
  type MessageJSON,
  MessageRepository,
  MessageScoredEvent,
} from '@/messages/domain';
import { MessageRepositoryInMemory } from '@/messages/infrastructure/persistence/in-memory/message.repository.in-memory';
import { URGENCY_SCORING_GATEWAY } from '@/scoring/domain/gateways';
import { FakeUrgencyScoringGateway } from '@/scoring/infrastructure/gateways';
import { UserFactory } from '@/users/__tests__/factories/user.factory';
import { FilterIncomingMessage, FilterIncomingMessageCommand } from './filter-incoming-message';

const createGenericMessageEvent = (props: Partial<GenericMessageEvent>): GenericMessageEvent => {
  return {
    type: 'message',
    subtype: undefined,
    event_ts: 'event_ts',
    team: 'teamId',
    channel: 'channelId',
    user: 'slackUserId',
    text: 'Message text',
    ts: 'ts',
    channel_type: 'channel',
    ...props,
  };
};

describe('Filter incoming message', () => {
  let handler: FilterIncomingMessage;
  let messageRepository: MessageRepositoryInMemory;
  let accountRepository: AccountRepositoryInMemory;
  let memberRepository: MemberRepositoryInMemory;
  let channelRepository: ChannelRepositoryInMemory;
  let conversationRepository: ConversationRepositoryInMemory;
  let scoringGateway: FakeUrgencyScoringGateway;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FilterIncomingMessage,
        { provide: MessageRepository, useClass: MessageRepositoryInMemory },
        { provide: AccountRepository, useClass: AccountRepositoryInMemory },
        { provide: MemberRepository, useClass: MemberRepositoryInMemory },
        { provide: ChannelRepository, useClass: ChannelRepositoryInMemory },
        {
          provide: ConversationRepository,
          useClass: ConversationRepositoryInMemory,
        },
        {
          provide: URGENCY_SCORING_GATEWAY,
          useClass: FakeUrgencyScoringGateway,
        },
      ],
    }).compile();

    handler = module.get(FilterIncomingMessage);
    messageRepository = module.get<MessageRepositoryInMemory>(MessageRepository);
    accountRepository = module.get<AccountRepositoryInMemory>(AccountRepository);
    memberRepository = module.get<MemberRepositoryInMemory>(MemberRepository);
    channelRepository = module.get<ChannelRepositoryInMemory>(ChannelRepository);
    conversationRepository = module.get<ConversationRepositoryInMemory>(ConversationRepository);
    scoringGateway = module.get<FakeUrgencyScoringGateway>(URGENCY_SCORING_GATEWAY);

    messageRepository.clear();
    accountRepository.clear();
    memberRepository.clear();
    channelRepository.clear();
    conversationRepository.clear();

    accountRepository.save(
      AccountFactory.create({
        id: 'accountId',
        slackTeamId: 'teamId',
      }),
    );
    memberRepository.save(
      MemberFactory.create({
        id: 'senderId',
        accountId: 'accountId',
        user: UserFactory.create({
          id: 'senderUserId',
          slackId: 'slackUserId',
        }),
      }),
    );
  });

  it('should create and persist a message', async () => {
    const command = new FilterIncomingMessageCommand({
      messageEvent: createGenericMessageEvent({
        ts: '1234567890.123456',
        channel: 'C_GENERAL',
        channel_type: 'channel',
        thread_ts: undefined,
        text: 'Hello world',
      }),
    });

    const result = await handler.execute(command);
    expect(result).toBeInstanceOf(Message);

    const saved = await messageRepository.findById(result!.id);
    expect(saved).not.toBeNull();
    expect(saved?.toJSON()).toMatchObject<Partial<MessageJSON>>({
      accountId: 'accountId',
      senderId: 'senderId',
      slackTs: '1234567890.123456',
      slackChannelId: 'C_GENERAL',
      slackChannelType: 'channel',
      slackThreadTs: null,
      text: 'Hello world',
    });
  });

  it('should emit a MessageCreatedEvent on the aggregate', async () => {
    const command = new FilterIncomingMessageCommand({
      messageEvent: createGenericMessageEvent({
        user: 'slackUserId',
        ts: '1234567890.123456',
        channel: 'C_GENERAL',
        channel_type: 'channel',
        thread_ts: undefined,
        text: 'Hello world',
      }),
    });

    const result = await handler.execute(command);
    const events = result!.findEvents(MessageCreatedEvent);
    expect(events).toHaveLength(1);
    expect(events[0].messageId).toBe(result!.id);
  });

  it('should persist a thread reply with thread_ts', async () => {
    const command = new FilterIncomingMessageCommand({
      messageEvent: createGenericMessageEvent({
        user: 'slackUserId',
        ts: '1234567890.123456',
        channel: 'C_GENERAL',
        channel_type: 'channel',
        thread_ts: '1234567890.123456',
        text: 'Thread reply',
      }),
    });

    const result = await handler.execute(command);
    const saved = await messageRepository.findById(result!.id);
    expect(saved?.toJSON().slackThreadTs).toBe('1234567890.123456');
  });

  it('should score the message urgency and persist it', async () => {
    const command = new FilterIncomingMessageCommand({
      messageEvent: createGenericMessageEvent({
        text: 'Production is down!',
      }),
    });

    const result = await handler.execute(command);
    const saved = await messageRepository.findById(result!.id);

    expect(saved?.toJSON().urgencyScore).not.toBeNull();
    expect(saved?.toJSON().urgencyReasoning).not.toBeNull();
  });

  it('should emit a MessageScoredEvent', async () => {
    const command = new FilterIncomingMessageCommand({
      messageEvent: createGenericMessageEvent({
        text: 'Production is down!',
      }),
    });

    const result = await handler.execute(command);
    const events = result!.findEvents(MessageScoredEvent);

    expect(events).toHaveLength(1);
    expect(events[0].score).toBeGreaterThanOrEqual(1);
    expect(events[0].score).toBeLessThanOrEqual(5);
  });

  describe('when message is from a channel', () => {
    beforeEach(async () => {
      await memberRepository.save(
        MemberFactory.create({
          id: 'recipient1Id',
          accountId: 'accountId',
          user: UserFactory.create({
            id: 'recipient1UserId',
            slackId: 'slackRecipient1',
          }),
        }),
      );
      await memberRepository.save(
        MemberFactory.create({
          id: 'recipient2Id',
          accountId: 'accountId',
          user: UserFactory.create({
            id: 'recipient2UserId',
            slackId: 'slackRecipient2',
          }),
        }),
      );
      await channelRepository.save(
        ChannelFactory.create({
          accountId: 'accountId',
          slackChannelId: 'C_GENERAL',
          memberIds: ['senderId', 'recipient1Id', 'recipient2Id'],
        }),
      );
    });

    it('should resolve recipients from channel members excluding sender', async () => {
      const command = new FilterIncomingMessageCommand({
        messageEvent: createGenericMessageEvent({
          channel: 'C_GENERAL',
          channel_type: 'channel',
        }),
      });

      await handler.execute(command);

      const lastInput = scoringGateway.getLastInput();
      expect(lastInput.recipients).toHaveLength(2);
      expect(lastInput.recipients.map((r) => r.getId())).toEqual(
        expect.arrayContaining(['recipient1Id', 'recipient2Id']),
      );
      expect(lastInput.recipients.map((r) => r.getId())).not.toContain('senderId');
    });
  });

  describe('when message is from a conversation (im/mpim)', () => {
    beforeEach(async () => {
      await memberRepository.save(
        MemberFactory.create({
          id: 'recipient1Id',
          accountId: 'accountId',
          user: UserFactory.create({
            id: 'recipient1UserId',
            slackId: 'slackRecipient1',
          }),
        }),
      );
      await conversationRepository.save(
        ConversationFactory.create({
          accountId: 'accountId',
          slackConversationId: 'D_DM',
          memberIds: ['senderId', 'recipient1Id'],
        }),
      );
    });

    it('should resolve recipients from conversation members excluding sender', async () => {
      const command = new FilterIncomingMessageCommand({
        messageEvent: createGenericMessageEvent({
          channel: 'D_DM',
          channel_type: 'im',
        }),
      });

      await handler.execute(command);

      const lastInput = scoringGateway.getLastInput();
      expect(lastInput.recipients).toHaveLength(1);
      expect(lastInput.recipients[0].getId()).toBe('recipient1Id');
    });
  });
});
