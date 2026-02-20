import { Test } from '@nestjs/testing';
import { SlackChannelsImportService, SlackConversationsImportService, SlackUsersImportService } from '@/accounts';
import { AccountFactory } from '@/accounts/__tests__/factories/account.factory';
import { MemberFactory } from '@/accounts/__tests__/factories/member.factory';
import { AccountRepository, MemberRepository } from '@/accounts/domain';
import { SLACK_USERS_GATEWAY, type SlackUserInfo } from '@/accounts/domain/gateways/slack-users.gateway';
import { MemberRole, MemberRoleLevel } from '@/accounts/domain/value-objects';
import { FakeSlackUsersGateway } from '@/accounts/infrastructure/gateways/fake-slack-users.gateway';
import { AccountRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/account.repository.in-memory';
import { MemberRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/member.repository.in-memory';
import { ChannelRepository } from '@/channels/domain';
import { SLACK_CHANNELS_GATEWAY } from '@/channels/domain/gateways/slack-channels.gateway';
import { FakeSlackChannelsGateway } from '@/channels/infrastructure/gateways/fake-slack-channels.gateway';
import { ChannelRepositoryInMemory } from '@/channels/infrastructure/persistence/in-memory/channel.repository.in-memory';
import { ConversationRepository } from '@/conversations';
import { SLACK_CONVERSATIONS_GATEWAY } from '@/conversations/domain/gateways/slack-conversations.gateway';
import { FakeSlackConversationsGateway } from '@/conversations/infrastructure/gateways/fake-slack-conversations.gateway';
import { ConversationRepositoryInMemory } from '@/conversations/infrastructure/persistence/in-memory/conversation.repository.in-memory';
import { User, UserRepository } from '@/users/domain';
import { UserRepositoryInMemory } from '@/users/infrastructure/persistence/inmemory/user.repository.in-memory';
import { ProvisionAccountFromSlack, ProvisionAccountFromSlackCommand } from './provision-account-from-slack';

const makeSlackUser = (overrides?: Partial<SlackUserInfo>): SlackUserInfo => ({
  slackId: 'U001',
  email: 'user@example.com',
  name: 'John Doe',
  isBot: false,
  deleted: false,
  ...overrides,
});

describe('Provision Account From Slack', () => {
  let handler: ProvisionAccountFromSlack;
  let accountRepository: AccountRepositoryInMemory;
  let memberRepository: MemberRepositoryInMemory;
  let userRepository: UserRepositoryInMemory;
  let slackUsersGateway: FakeSlackUsersGateway;

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

    slackUsersGateway.setUsers([
      makeSlackUser({
        slackId: 'U_INSTALLER',
        email: 'installer@example.com',
        name: 'Installer',
      }),
    ]);

    accountRepository.clear();
    memberRepository.clear();
    userRepository.clear();
  });

  describe('when the Slack team has not been provisioned yet', () => {
    it('should create an account with the team name and teamId', async () => {
      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      expect(account).not.toBeNull();
      expect(account?.toJSON()).toMatchObject({
        name: 'Acme Corp',
        slackTeamId: 'T_ACME',
      });
    });

    it('should create a User and a founder Member for the installing Slack user', async () => {
      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const account = await accountRepository.findBySlackTeamId('T_ACME');
      const installerUser = await userRepository.findBySlackId('U_INSTALLER');

      expect(installerUser).not.toBeNull();
      expect(installerUser?.getSlackId()).toBe('U_INSTALLER');

      const members = await memberRepository.findByAccountId(account!.getId());
      expect(members).toHaveLength(1);

      const founderMember = members[0];
      expect(founderMember.toJSON()).toMatchObject({
        accountId: account!.getId(),
        userId: installerUser!.getId(),
        role: MemberRoleLevel.ADMIN,
      });
      expect(founderMember.isActive()).toBe(true);
    });

    it('should create a User and an inactive Member for each non-bot, non-deleted team member', async () => {
      slackUsersGateway.setUsers([
        makeSlackUser({
          slackId: 'U_INSTALLER',
          email: 'installer@example.com',
          name: 'Installer',
        }),
        makeSlackUser({
          slackId: 'U002',
          email: 'alice@example.com',
          name: 'Alice',
        }),
        makeSlackUser({
          slackId: 'U003',
          email: 'bob@example.com',
          name: 'Bob',
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
      const members = await memberRepository.findByAccountId(account!.getId());

      expect(members).toHaveLength(3);

      const alice = await userRepository.findBySlackId('U002');
      const aliceMember = members.find((m) => m.toJSON().userId === alice!.getId());
      expect(aliceMember?.toJSON()).toMatchObject({
        role: MemberRoleLevel.USER,
      });
      expect(aliceMember?.isActive()).toBe(false);

      const bob = await userRepository.findBySlackId('U003');
      const bobMember = members.find((m) => m.toJSON().userId === bob!.getId());
      expect(bobMember?.toJSON()).toMatchObject({
        role: MemberRoleLevel.USER,
      });
      expect(bobMember?.isActive()).toBe(false);
    });

    it('should skip bot users', async () => {
      slackUsersGateway.setUsers([
        makeSlackUser({
          slackId: 'U_INSTALLER',
          email: 'installer@example.com',
          name: 'Installer',
        }),
        makeSlackUser({
          slackId: 'U_BOT',
          email: null,
          name: 'My Bot',
          isBot: true,
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
      const members = await memberRepository.findByAccountId(account!.getId());
      expect(members).toHaveLength(1);

      const botUser = await userRepository.findBySlackId('U_BOT');
      expect(botUser).toBeNull();
    });

    it('should skip deleted users', async () => {
      slackUsersGateway.setUsers([
        makeSlackUser({
          slackId: 'U_INSTALLER',
          email: 'installer@example.com',
          name: 'Installer',
        }),
        makeSlackUser({
          slackId: 'U_DELETED',
          email: 'gone@example.com',
          name: 'Deleted User',
          deleted: true,
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
      const members = await memberRepository.findByAccountId(account!.getId());
      expect(members).toHaveLength(1);

      const deletedUser = await userRepository.findBySlackId('U_DELETED');
      expect(deletedUser).toBeNull();
    });

    it('should use an existing User when one already exists with the same slackId', async () => {
      slackUsersGateway.setUsers([
        makeSlackUser({
          slackId: 'U_INSTALLER',
          email: 'installer@example.com',
          name: 'Installer',
        }),
        makeSlackUser({
          slackId: 'U002',
          email: 'alice@example.com',
          name: 'Alice',
        }),
      ]);

      const existingUser = await userRepository.findBySlackId('U002');
      expect(existingUser).toBeNull();

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const aliceAfterFirstRun = await userRepository.findBySlackId('U002');
      expect(aliceAfterFirstRun).not.toBeNull();

      accountRepository.clear();
      memberRepository.clear();

      slackUsersGateway.setUsers([
        makeSlackUser({
          slackId: 'U_INSTALLER2',
          email: 'installer2@example.com',
          name: 'Installer2',
        }),
        makeSlackUser({
          slackId: 'U002',
          email: 'alice@example.com',
          name: 'Alice',
        }),
      ]);

      const command2 = new ProvisionAccountFromSlackCommand({
        teamId: 'T_OTHER',
        teamName: 'Other Corp',
        botToken: 'xoxb-token-2',
        installerSlackUserId: 'U_INSTALLER2',
      });

      await handler.execute(command2);

      const aliceUsers = (await userRepository.findAll()).filter((u) => u.getSlackId() === 'U002');
      expect(aliceUsers).toHaveLength(1);

      const account2 = await accountRepository.findBySlackTeamId('T_OTHER');
      const members2 = await memberRepository.findByAccountId(account2!.getId());
      const aliceMember = members2.find((m) => m.toJSON().userId === aliceAfterFirstRun!.getId());
      expect(aliceMember).toBeDefined();
    });
  });

  describe('when the account already exists for this teamId', () => {
    it('should reuse the existing account and not create a duplicate', async () => {
      const existingAccount = AccountFactory.create({
        slackTeamId: 'T_ACME',
      });
      await accountRepository.save(existingAccount);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const accounts = await accountRepository.findAll();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].getId()).toBe(existingAccount.getId());
    });

    it('should import new users that do not exist yet', async () => {
      const existingAccount = AccountFactory.create({
        slackTeamId: 'T_ACME',
      });
      await accountRepository.save(existingAccount);

      slackUsersGateway.setUsers([
        makeSlackUser({
          slackId: 'U_INSTALLER',
          email: 'installer@example.com',
          name: 'Installer',
        }),
        makeSlackUser({
          slackId: 'U_NEW',
          email: 'newuser@example.com',
          name: 'New User',
        }),
      ]);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const newUser = await userRepository.findBySlackId('U_NEW');
      expect(newUser).not.toBeNull();

      const members = await memberRepository.findByAccountId(existingAccount.getId());
      const newMember = members.find((m) => m.toJSON().userId === newUser!.getId());
      expect(newMember).toBeDefined();
      expect(newMember?.toJSON()).toMatchObject({
        accountId: existingAccount.getId(),
        userId: newUser!.getId(),
        role: MemberRoleLevel.USER,
      });
    });

    it('should skip creating a member for a user who is already a member', async () => {
      const existingAccount = AccountFactory.create({
        slackTeamId: 'T_ACME',
      });
      await accountRepository.save(existingAccount);

      const existingUser = User.createFromSlack({
        slackId: 'U_EXISTING',
        email: 'existing@example.com',
        name: 'Existing User',
      });
      await userRepository.save(existingUser);

      const existingMember = MemberFactory.create({
        accountId: existingAccount.getId(),
        user: existingUser,
      });
      await memberRepository.save(existingMember);

      slackUsersGateway.setUsers([
        makeSlackUser({
          slackId: 'U_EXISTING',
          email: 'existing@example.com',
          name: 'Existing User',
        }),
      ]);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const members = await memberRepository.findByAccountId(existingAccount.getId());
      const membersForUser = members.filter((m) => m.toJSON().userId === existingUser.getId());
      expect(membersForUser).toHaveLength(1);
    });

    it('should preserve existing member roles when re-importing', async () => {
      const existingAccount = AccountFactory.create({
        slackTeamId: 'T_ACME',
      });
      await accountRepository.save(existingAccount);

      const adminUser = User.createFromSlack({
        slackId: 'U_ADMIN',
        email: 'admin@example.com',
        name: 'Admin User',
      });
      await userRepository.save(adminUser);

      const adminMember = MemberFactory.createAdmin({
        accountId: existingAccount.getId(),
        user: adminUser,
        role: MemberRole.admin,
      });
      await memberRepository.save(adminMember);

      slackUsersGateway.setUsers([
        makeSlackUser({
          slackId: 'U_ADMIN',
          email: 'admin@example.com',
          name: 'Admin User',
        }),
      ]);

      const command = new ProvisionAccountFromSlackCommand({
        teamId: 'T_ACME',
        teamName: 'Acme Corp',
        botToken: 'xoxb-token',
        installerSlackUserId: 'U_INSTALLER',
      });

      await handler.execute(command);

      const savedMember = await memberRepository.findByAccountIdAndUserId({
        accountId: existingAccount.getId(),
        userId: adminUser.getId(),
      });
      expect(savedMember?.toJSON()).toMatchObject({
        role: MemberRoleLevel.ADMIN,
      });
    });
  });
});
