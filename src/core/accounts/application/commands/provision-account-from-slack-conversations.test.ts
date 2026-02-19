import { Test } from '@nestjs/testing';

import { AccountFactory } from '@/accounts/__tests__/factories/account.factory';
import { AccountRepository, MemberRepository } from '@/accounts/domain';
import {
  SLACK_USERS_GATEWAY,
  type SlackUserInfo,
} from '@/accounts/domain/gateways/slack-users.gateway';
import { FakeSlackUsersGateway } from '@/accounts/infrastructure/gateways/fake-slack-users.gateway';
import { AccountRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/account.repository.in-memory';
import { MemberRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/member.repository.in-memory';
import { ChannelRepository } from '@/channels/domain';
import { SLACK_CHANNELS_GATEWAY } from '@/channels/domain/gateways/slack-channels.gateway';
import { FakeSlackChannelsGateway } from '@/channels/infrastructure/gateways/fake-slack-channels.gateway';
import { ChannelRepositoryInMemory } from '@/channels/infrastructure/persistence/in-memory/channel.repository.in-memory';
import { ConversationFactory } from '@/conversations/__tests__/factories/conversation.factory';
import { ConversationRepository } from '@/conversations/domain';
import {
  SLACK_CONVERSATIONS_GATEWAY,
  type SlackConversationInfo,
} from '@/conversations/domain/gateways/slack-conversations.gateway';
import { FakeSlackConversationsGateway } from '@/conversations/infrastructure/gateways/fake-slack-conversations.gateway';
import { ConversationRepositoryInMemory } from '@/conversations/infrastructure/persistence/in-memory/conversation.repository.in-memory';
import { UserFactory } from '@/users/__tests__/factories/user.factory';
import { Email, UserRepository } from '@/users/domain';
import { UserRepositoryInMemory } from '@/users/infrastructure/persistence/inmemory/user.repository.in-memory';

import {
  ProvisionAccountFromSlackCommand,
  ProvisionAccountFromSlackHandler,
} from './provision-account-from-slack';

const makeSlackUser = (overrides?: Partial<SlackUserInfo>): SlackUserInfo => ({
  slackId: 'U_INSTALLER',
  email: 'installer@example.com',
  name: 'Installer',
  isBot: false,
  deleted: false,
  ...overrides,
});

const makeSlackConversation = (
  overrides?: Partial<SlackConversationInfo>,
): SlackConversationInfo => ({
  slackConversationId: 'D_001',
  memberSlackIds: ['U_INSTALLER', 'U_OTHER'],
  isGroupDm: false,
  ...overrides,
});

describe('Provision Account From Slack — Conversation Import', () => {
  let handler: ProvisionAccountFromSlackHandler;
  let accountRepository: AccountRepositoryInMemory;
  let memberRepository: MemberRepositoryInMemory;
  let userRepository: UserRepositoryInMemory;
  let slackUsersGateway: FakeSlackUsersGateway;
  let channelRepository: ChannelRepositoryInMemory;
  let conversationRepository: ConversationRepositoryInMemory;
  let slackConversationsGateway: FakeSlackConversationsGateway;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProvisionAccountFromSlackHandler,
        { provide: AccountRepository, useClass: AccountRepositoryInMemory },
        { provide: MemberRepository, useClass: MemberRepositoryInMemory },
        { provide: UserRepository, useClass: UserRepositoryInMemory },
        { provide: SLACK_USERS_GATEWAY, useClass: FakeSlackUsersGateway },
        { provide: ChannelRepository, useClass: ChannelRepositoryInMemory },
        { provide: SLACK_CHANNELS_GATEWAY, useClass: FakeSlackChannelsGateway },
        {
          provide: ConversationRepository,
          useClass: ConversationRepositoryInMemory,
        },
        {
          provide: SLACK_CONVERSATIONS_GATEWAY,
          useClass: FakeSlackConversationsGateway,
        },
      ],
    }).compile();

    handler = module.get(ProvisionAccountFromSlackHandler);
    accountRepository =
      module.get<AccountRepositoryInMemory>(AccountRepository);
    memberRepository = module.get<MemberRepositoryInMemory>(MemberRepository);
    userRepository = module.get<UserRepositoryInMemory>(UserRepository);
    slackUsersGateway = module.get<FakeSlackUsersGateway>(SLACK_USERS_GATEWAY);
    channelRepository =
      module.get<ChannelRepositoryInMemory>(ChannelRepository);
    conversationRepository = module.get<ConversationRepositoryInMemory>(
      ConversationRepository,
    );
    slackConversationsGateway = module.get<FakeSlackConversationsGateway>(
      SLACK_CONVERSATIONS_GATEWAY,
    );

    slackUsersGateway.setUsers([
      makeSlackUser({ slackId: 'U_INSTALLER', name: 'Installer' }),
      makeSlackUser({
        slackId: 'U_OTHER',
        name: 'Other',
        email: 'other@example.com',
      }),
    ]);
    slackConversationsGateway.setConversations([]);

    accountRepository.clear();
    memberRepository.clear();
    userRepository.clear();
    channelRepository.clear();
    conversationRepository.clear();
  });

  const executeCommand = () =>
    handler.execute(
      new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      }),
    );

  describe('when importing 1:1 DM conversations', () => {
    it('should import a 1:1 DM conversation during provisioning', async () => {
      slackConversationsGateway.setConversations([
        makeSlackConversation({
          slackConversationId: 'D_001',
          memberSlackIds: ['U_INSTALLER', 'U_OTHER'],
          isGroupDm: false,
        }),
      ]);

      await executeCommand();

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const conversations = await conversationRepository.findByAccountId(
        account!.getId(),
      );

      expect(conversations).toHaveLength(1);
      expect(conversations[0].toJSON().slackConversationId).toBe('D_001');
    });

    it('should store isGroupDm as false for 1:1 DMs', async () => {
      slackConversationsGateway.setConversations([
        makeSlackConversation({ isGroupDm: false }),
      ]);

      await executeCommand();

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const conversations = await conversationRepository.findByAccountId(
        account!.getId(),
      );

      expect(conversations[0].toJSON().isGroupDm).toBe(false);
    });
  });

  describe('when importing group DM conversations', () => {
    it('should import a group DM with 3+ members', async () => {
      slackUsersGateway.setUsers([
        makeSlackUser({ slackId: 'U_INSTALLER', name: 'Installer' }),
        makeSlackUser({ slackId: 'U_A', name: 'A', email: 'a@example.com' }),
        makeSlackUser({ slackId: 'U_B', name: 'B', email: 'b@example.com' }),
      ]);

      slackConversationsGateway.setConversations([
        makeSlackConversation({
          slackConversationId: 'G_001',
          memberSlackIds: ['U_INSTALLER', 'U_A', 'U_B'],
          isGroupDm: true,
        }),
      ]);

      await executeCommand();

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const conversations = await conversationRepository.findByAccountId(
        account!.getId(),
      );

      expect(conversations).toHaveLength(1);
      expect(conversations[0].toJSON().isGroupDm).toBe(true);
    });
  });

  describe('when storing conversation properties', () => {
    it('should resolve Slack user IDs to internal User IDs', async () => {
      slackConversationsGateway.setConversations([
        makeSlackConversation({
          slackConversationId: 'D_001',
          memberSlackIds: ['U_INSTALLER', 'U_OTHER'],
          isGroupDm: false,
        }),
      ]);

      await executeCommand();

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const conversations = await conversationRepository.findByAccountId(
        account!.getId(),
      );

      const json = conversations[0].toJSON();
      const installerUser = await userRepository.findBySlackId('U_INSTALLER');
      const otherUser = await userRepository.findBySlackId('U_OTHER');

      expect(json.memberIds).toHaveLength(2);
      expect(json.memberIds).toContain(installerUser!.getId());
      expect(json.memberIds).toContain(otherUser!.getId());
    });

    it('should store the correct conversation properties', async () => {
      slackConversationsGateway.setConversations([
        makeSlackConversation({
          slackConversationId: 'D_001',
          memberSlackIds: ['U_INSTALLER', 'U_OTHER'],
          isGroupDm: false,
        }),
      ]);

      await executeCommand();

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const conversations = await conversationRepository.findByAccountId(
        account!.getId(),
      );

      expect(conversations[0].toJSON()).toMatchObject({
        accountId: account!.getId(),
        slackConversationId: 'D_001',
        isGroupDm: false,
      });
      expect(conversations[0].toJSON().memberIds).toHaveLength(2);
    });
  });

  describe('when some members are not in the system', () => {
    it('should skip conversations where not all members are resolved', async () => {
      slackConversationsGateway.setConversations([
        makeSlackConversation({
          slackConversationId: 'D_UNKNOWN',
          memberSlackIds: ['U_INSTALLER', 'U_UNKNOWN_OUTSIDER'],
          isGroupDm: false,
        }),
      ]);

      // U_UNKNOWN_OUTSIDER is not in slackUsersGateway so won't be imported
      slackUsersGateway.setUsers([
        makeSlackUser({ slackId: 'U_INSTALLER', name: 'Installer' }),
      ]);

      await executeCommand();

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const conversations = await conversationRepository.findByAccountId(
        account!.getId(),
      );

      expect(conversations).toHaveLength(0);
    });
  });

  describe('when re-importing (account already exists)', () => {
    it('should update existing conversation members on re-import', async () => {
      const existingAccount = AccountFactory.create({
        id: 'accountId',
        slackTeamId: 'T_ACME',
      });
      await accountRepository.save(existingAccount);

      // Pre-seed a user so we can reference a known ID
      const installerUser = UserFactory.create({
        id: 'userId-installer',
        slackId: 'U_INSTALLER',
        email: Email.create('installer@example.com'),
      });
      await userRepository.save(installerUser);

      const existingConversation = ConversationFactory.create({
        id: 'convId',
        accountId: existingAccount.getId(),
        slackConversationId: 'D_001',
        memberIds: [installerUser.getId()],
        isGroupDm: false,
      });
      await conversationRepository.save(existingConversation);

      slackConversationsGateway.setConversations([
        makeSlackConversation({
          slackConversationId: 'D_001',
          memberSlackIds: ['U_INSTALLER', 'U_OTHER'],
          isGroupDm: false,
        }),
      ]);

      await executeCommand();

      const updated = await conversationRepository.findBySlackConversationId({
        accountId: existingAccount.getId(),
        slackConversationId: 'D_001',
      });

      expect(updated!.toJSON().memberIds).toHaveLength(2);
    });

    it('should preserve the conversation domain ID when updating', async () => {
      const existingAccount = AccountFactory.create({
        id: 'accountId',
        slackTeamId: 'T_ACME',
      });
      await accountRepository.save(existingAccount);

      const existingConversation = ConversationFactory.create({
        id: 'convId',
        accountId: existingAccount.getId(),
        slackConversationId: 'D_001',
        memberIds: [],
        isGroupDm: false,
      });
      await conversationRepository.save(existingConversation);

      slackConversationsGateway.setConversations([
        makeSlackConversation({
          slackConversationId: 'D_001',
          memberSlackIds: ['U_INSTALLER', 'U_OTHER'],
          isGroupDm: false,
        }),
      ]);

      await executeCommand();

      const updated = await conversationRepository.findBySlackConversationId({
        accountId: existingAccount.getId(),
        slackConversationId: 'D_001',
      });

      expect(updated!.toJSON().id).toBe('convId');
    });

    it('should create new conversations that did not exist before', async () => {
      const existingAccount = AccountFactory.create({
        id: 'accountId',
        slackTeamId: 'T_ACME',
      });
      await accountRepository.save(existingAccount);

      const existingConversation = ConversationFactory.create({
        id: 'convId',
        accountId: existingAccount.getId(),
        slackConversationId: 'D_001',
        memberIds: [],
        isGroupDm: false,
      });
      await conversationRepository.save(existingConversation);

      slackConversationsGateway.setConversations([
        makeSlackConversation({
          slackConversationId: 'D_001',
          memberSlackIds: ['U_INSTALLER', 'U_OTHER'],
        }),
        makeSlackConversation({
          slackConversationId: 'D_NEW',
          memberSlackIds: ['U_INSTALLER', 'U_OTHER'],
        }),
      ]);

      await executeCommand();

      const conversations = await conversationRepository.findByAccountId(
        existingAccount.getId(),
      );
      expect(conversations).toHaveLength(2);

      const newConv = await conversationRepository.findBySlackConversationId({
        accountId: existingAccount.getId(),
        slackConversationId: 'D_NEW',
      });
      expect(newConv).not.toBeNull();
    });
  });
});
