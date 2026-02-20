import { Test } from '@nestjs/testing';
import { SlackChannelsImportService, SlackConversationsImportService, SlackUsersImportService } from '@/accounts';
import { AccountFactory } from '@/accounts/__tests__/factories/account.factory';
import { AccountRepository, MemberRepository } from '@/accounts/domain';
import { SLACK_USERS_GATEWAY, type SlackUserInfo } from '@/accounts/domain/gateways/slack-users.gateway';
import { FakeSlackUsersGateway } from '@/accounts/infrastructure/gateways/fake-slack-users.gateway';
import { AccountRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/account.repository.in-memory';
import { MemberRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/member.repository.in-memory';
import { ChannelFactory } from '@/channels/__tests__/factories/channel.factory';
import { ChannelRepository } from '@/channels/domain';
import { SLACK_CHANNELS_GATEWAY, type SlackChannelInfo } from '@/channels/domain/gateways/slack-channels.gateway';
import { FakeSlackChannelsGateway } from '@/channels/infrastructure/gateways/fake-slack-channels.gateway';
import { ChannelRepositoryInMemory } from '@/channels/infrastructure/persistence/in-memory/channel.repository.in-memory';
import { ConversationRepository } from '@/conversations';
import { SLACK_CONVERSATIONS_GATEWAY } from '@/conversations/domain/gateways/slack-conversations.gateway';
import { FakeSlackConversationsGateway } from '@/conversations/infrastructure/gateways/fake-slack-conversations.gateway';
import { ConversationRepositoryInMemory } from '@/conversations/infrastructure/persistence/in-memory/conversation.repository.in-memory';
import { UserRepository } from '@/users/domain';
import { UserRepositoryInMemory } from '@/users/infrastructure/persistence/inmemory/user.repository.in-memory';
import { ProvisionAccountFromSlack, ProvisionAccountFromSlackCommand } from './provision-account-from-slack';

const makeSlackUser = (overrides?: Partial<SlackUserInfo>): SlackUserInfo => ({
  slackId: 'U_INSTALLER',
  email: 'installer@example.com',
  name: 'Installer',
  isBot: false,
  deleted: false,
  ...overrides,
});

const makeSlackChannel = (overrides?: Partial<SlackChannelInfo>): SlackChannelInfo => ({
  slackChannelId: 'C_GENERAL',
  name: 'general',
  topic: 'General discussion',
  purpose: 'Company-wide announcements',
  isPrivate: false,
  isArchived: false,
  memberCount: 10,
  memberSlackIds: [],
  ...overrides,
});

describe('Provision Account From Slack — Channel Import', () => {
  let handler: ProvisionAccountFromSlack;
  let accountRepository: AccountRepositoryInMemory;
  let memberRepository: MemberRepositoryInMemory;
  let userRepository: UserRepositoryInMemory;
  let slackUsersGateway: FakeSlackUsersGateway;
  let channelRepository: ChannelRepositoryInMemory;
  let slackChannelsGateway: FakeSlackChannelsGateway;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProvisionAccountFromSlack,
        SlackUsersImportService,
        SlackChannelsImportService,
        SlackConversationsImportService,
        { provide: AccountRepository, useClass: AccountRepositoryInMemory },
        { provide: MemberRepository, useClass: MemberRepositoryInMemory },
        { provide: UserRepository, useClass: UserRepositoryInMemory },
        { provide: ChannelRepository, useClass: ChannelRepositoryInMemory },
        { provide: ConversationRepository, useClass: ConversationRepositoryInMemory },
        { provide: SLACK_USERS_GATEWAY, useClass: FakeSlackUsersGateway },
        { provide: SLACK_CHANNELS_GATEWAY, useClass: FakeSlackChannelsGateway },
        { provide: SLACK_CONVERSATIONS_GATEWAY, useClass: FakeSlackConversationsGateway },
      ],
    }).compile();

    handler = module.get(ProvisionAccountFromSlack);
    accountRepository = module.get<AccountRepositoryInMemory>(AccountRepository);
    memberRepository = module.get<MemberRepositoryInMemory>(MemberRepository);
    userRepository = module.get<UserRepositoryInMemory>(UserRepository);
    slackUsersGateway = module.get<FakeSlackUsersGateway>(SLACK_USERS_GATEWAY);
    channelRepository = module.get<ChannelRepositoryInMemory>(ChannelRepository);
    slackChannelsGateway = module.get<FakeSlackChannelsGateway>(SLACK_CHANNELS_GATEWAY);

    slackUsersGateway.setUsers([makeSlackUser()]);
    slackChannelsGateway.setChannels([]);

    accountRepository.clear();
    memberRepository.clear();
    userRepository.clear();
    channelRepository.clear();
  });

  describe('when the Slack team has not been provisioned yet', () => {
    it('should import channels alongside users during provisioning', async () => {
      slackChannelsGateway.setChannels([
        makeSlackChannel({ slackChannelId: 'C_GENERAL', name: 'general' }),
        makeSlackChannel({ slackChannelId: 'C_RANDOM', name: 'random' }),
      ]);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const channels = await channelRepository.findByAccountId(account!.getId());

      expect(channels).toHaveLength(2);
      expect(channels.map((c) => c.toJSON().name).sort()).toEqual(['general', 'random']);
    });

    it('should store the correct channel properties', async () => {
      slackChannelsGateway.setChannels([
        makeSlackChannel({
          slackChannelId: 'C_GENERAL',
          name: 'general',
          topic: 'Company chat',
          purpose: 'General announcements',
          isPrivate: false,
          isArchived: false,
        }),
      ]);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const channels = await channelRepository.findByAccountId(account!.getId());

      expect(channels[0].toJSON()).toMatchObject({
        accountId: account!.getId(),
        slackChannelId: 'C_GENERAL',
        name: 'general',
        topic: 'Company chat',
        purpose: 'General announcements',
        isPrivate: false,
        isArchived: false,
      });
    });

    it('should import archived channels (flagged as archived)', async () => {
      slackChannelsGateway.setChannels([
        makeSlackChannel({
          slackChannelId: 'C_OLD',
          name: 'old-project',
          isArchived: true,
        }),
      ]);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const channels = await channelRepository.findByAccountId(account!.getId());

      expect(channels).toHaveLength(1);
      expect(channels[0].toJSON().isArchived).toBe(true);
    });

    it('should import private channels', async () => {
      slackChannelsGateway.setChannels([
        makeSlackChannel({
          slackChannelId: 'C_SECRET',
          name: 'secret-project',
          isPrivate: true,
        }),
      ]);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const channels = await channelRepository.findByAccountId(account!.getId());

      expect(channels).toHaveLength(1);
      expect(channels[0].toJSON().isPrivate).toBe(true);
    });
  });

  describe('when the account already exists (re-import)', () => {
    it('should update existing channels with new data from Slack', async () => {
      const existingAccount = AccountFactory.create({
        id: 'accountId',
        slackTeamId: 'T_ACME',
      });
      await accountRepository.save(existingAccount);

      const existingChannel = ChannelFactory.create({
        id: 'channelId',
        accountId: existingAccount.getId(),
        slackChannelId: 'C_GENERAL',
        name: 'general',
        topic: 'Old topic',
        purpose: 'Old purpose',
        isArchived: false,
      });
      await channelRepository.save(existingChannel);

      slackChannelsGateway.setChannels([
        makeSlackChannel({
          slackChannelId: 'C_GENERAL',
          name: 'general-renamed',
          topic: 'New topic',
          purpose: 'New purpose',
          memberCount: 20,
          isArchived: true,
        }),
      ]);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const updatedChannel = await channelRepository.findBySlackChannelId({
        accountId: existingAccount.getId(),
        slackChannelId: 'C_GENERAL',
      });
      expect(updatedChannel?.toJSON()).toMatchObject({
        slackChannelId: 'C_GENERAL',
        name: 'general-renamed',
        topic: 'New topic',
        purpose: 'New purpose',
        isArchived: true,
      });
    });

    it('should preserve the channel domain ID when updating an existing channel', async () => {
      const existingAccount = AccountFactory.create({
        id: 'accountId',
        slackTeamId: 'T_ACME',
      });
      await accountRepository.save(existingAccount);

      const existingChannel = ChannelFactory.create({
        id: 'channelId',
        accountId: existingAccount.getId(),
        slackChannelId: 'C_GENERAL',
        name: 'general',
        topic: '',
        purpose: '',
        isArchived: false,
      });
      await channelRepository.save(existingChannel);

      slackChannelsGateway.setChannels([
        makeSlackChannel({
          slackChannelId: 'C_GENERAL',
          name: 'general-updated',
          memberCount: 99,
        }),
      ]);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const updatedChannel = await channelRepository.findBySlackChannelId({
        accountId: existingAccount.getId(),
        slackChannelId: 'C_GENERAL',
      });
      expect(updatedChannel?.toJSON().id).toBe('channelId');
    });

    it('should create new channels that did not exist before', async () => {
      const existingAccount = AccountFactory.create({
        id: 'accountId',
        slackTeamId: 'T_ACME',
      });
      await accountRepository.save(existingAccount);

      const existingChannel = ChannelFactory.create({
        id: 'channelId',
        accountId: existingAccount.getId(),
        slackChannelId: 'C_GENERAL',
        name: 'general',
        topic: '',
        purpose: '',
        isArchived: false,
      });
      await channelRepository.save(existingChannel);

      slackChannelsGateway.setChannels([
        makeSlackChannel({ slackChannelId: 'C_GENERAL', name: 'general' }),
        makeSlackChannel({
          slackChannelId: 'C_NEW',
          name: 'new-channel',
          topic: 'Fresh channel',
          purpose: 'A brand new channel',
          memberCount: 3,
        }),
      ]);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const channels = await channelRepository.findByAccountId(existingAccount.getId());
      expect(channels).toHaveLength(2);

      const newChannel = await channelRepository.findBySlackChannelId({
        accountId: existingAccount.getId(),
        slackChannelId: 'C_NEW',
      });
      expect(newChannel).not.toBeNull();
      expect(newChannel?.toJSON()).toMatchObject({
        accountId: existingAccount.getId(),
        slackChannelId: 'C_NEW',
        name: 'new-channel',
        topic: 'Fresh channel',
        purpose: 'A brand new channel',
      });
    });
  });
});
