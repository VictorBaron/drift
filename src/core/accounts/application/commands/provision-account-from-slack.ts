import { Inject } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from 'src/common/application/command-handler';
import {
  Account,
  AccountRepository,
  Member,
  MemberRepository,
} from '@/accounts/domain';
import {
  SLACK_USERS_GATEWAY,
  SlackUserInfo,
  type SlackUsersGateway,
} from '@/accounts/domain/gateways/slack-users.gateway';
import { Channel, ChannelRepository } from '@/channels/domain';
import {
  SLACK_CHANNELS_GATEWAY,
  type SlackChannelsGateway,
} from '@/channels/domain/gateways/slack-channels.gateway';
import { Conversation, ConversationRepository } from '@/conversations/domain';
import {
  SLACK_CONVERSATIONS_GATEWAY,
  type SlackConversationsGateway,
} from '@/conversations/domain/gateways/slack-conversations.gateway';
import { User, UserRepository } from '@/users/domain';

export class ProvisionAccountFromSlackCommand {
  constructor(
    readonly props: {
      teamId: string;
      teamName: string;
      botToken: string;
      installerSlackUserId: string;
    },
  ) {}
}

@CommandHandler(ProvisionAccountFromSlackCommand)
export class ProvisionAccountFromSlackHandler extends BaseCommandHandler<ProvisionAccountFromSlackCommand> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly memberRepository: MemberRepository,
    private readonly userRepository: UserRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly conversationRepository: ConversationRepository,
    @Inject(SLACK_USERS_GATEWAY)
    private readonly slackUsersGateway: SlackUsersGateway,
    @Inject(SLACK_CHANNELS_GATEWAY)
    private readonly slackChannelsGateway: SlackChannelsGateway,
    @Inject(SLACK_CONVERSATIONS_GATEWAY)
    private readonly slackConversationsGateway: SlackConversationsGateway,
  ) {
    super();
  }

  async execute(command: ProvisionAccountFromSlackCommand): Promise<void> {
    const { teamId, teamName, botToken, installerSlackUserId } = command.props;

    const account = await this.findOrCreateAccount({ teamId, teamName });

    await this.importUsers({ account, botToken, installerSlackUserId });

    await this.importChannels({ account, botToken });

    await this.importConversations({ account, botToken });
  }

  private async findOrCreateAccount({
    teamId,
    teamName,
  }: {
    teamId: string;
    teamName: string;
  }): Promise<Account> {
    const existing = await this.accountRepository.findBySlackTeamId(teamId);
    if (existing) return existing;

    const account = Account.create({ name: teamName, slackTeamId: teamId });

    await this.accountRepository.save(account);
    return account;
  }

  private async importUsers({
    account,
    botToken,
    installerSlackUserId,
  }: {
    account: Account;
    botToken: string;
    installerSlackUserId: string;
  }): Promise<void> {
    const slackUsers = await this.slackUsersGateway.listTeamMembers(botToken);
    const eligibleUsers = slackUsers.filter((u) => !u.isBot && !u.deleted);

    this.logger.log(eligibleUsers);

    const installerSlackUser = eligibleUsers.find(
      (slackUser) => slackUser.slackId === installerSlackUserId,
    );

    if (!installerSlackUser) return;

    const installer = await this.findOrCreateFounder(
      installerSlackUser,
      account,
    );

    for (const slackUser of eligibleUsers) {
      await this.findOrInviteMember(slackUser, installer);
    }
  }

  private async findOrCreateFounder(
    installerSlackUser: SlackUserInfo,
    account: Account,
  ) {
    const installerUser = await this.findOrCreateUser(installerSlackUser);

    const existingMember = await this.memberRepository.findByAccountIdAndUserId(
      {
        accountId: account.getId(),
        userId: installerUser.getId(),
      },
    );

    if (existingMember) return existingMember;
    const installer = Member.createFounder({
      accountId: account.getId(),
      user: installerUser,
    });

    await this.memberRepository.save(installer);
    return installer;
  }

  private async findOrInviteMember(slackUser: SlackUserInfo, inviter: Member) {
    const user = await this.findOrCreateUser(slackUser);

    const existingMember = await this.memberRepository.findByAccountIdAndUserId(
      {
        accountId: inviter.getAccountId(),
        userId: user.getId(),
      },
    );
    if (existingMember) return existingMember;

    const newMember = Member.invite({
      inviter,
      user,
    });
    await this.memberRepository.save(newMember);
    return newMember;
  }

  private async importChannels({
    account,
    botToken,
  }: {
    account: Account;
    botToken: string;
  }): Promise<void> {
    const slackChannels =
      await this.slackChannelsGateway.listTeamChannels(botToken);

    this.logger.log(slackChannels);

    for (const sc of slackChannels) {
      const existing = await this.channelRepository.findBySlackChannelId({
        accountId: account.getId(),
        slackChannelId: sc.slackChannelId,
      });

      if (existing) {
        existing.update({
          name: sc.name,
          topic: sc.topic,
          purpose: sc.purpose,
          isPrivate: sc.isPrivate,
          isArchived: sc.isArchived,
          memberCount: sc.memberCount,
        });
        await this.channelRepository.save(existing);
        continue;
      }
      const channel = Channel.create({
        accountId: account.getId(),
        slackChannelId: sc.slackChannelId,
        name: sc.name,
        topic: sc.topic,
        purpose: sc.purpose,
        isPrivate: sc.isPrivate,
        isArchived: sc.isArchived,
        memberCount: sc.memberCount,
      });
      await this.channelRepository.save(channel);
    }
  }

  private async importConversations({
    account,
    botToken,
  }: {
    account: Account;
    botToken: string;
  }): Promise<void> {
    const slackConversations =
      await this.slackConversationsGateway.listUserConversations(botToken);

    this.logger.log(slackConversations);

    for (const sc of slackConversations) {
      const resolvedMemberIds = await this.resolveMembers(sc.memberSlackIds);
      if (!resolvedMemberIds) continue;

      const existing =
        await this.conversationRepository.findBySlackConversationId({
          accountId: account.getId(),
          slackConversationId: sc.slackConversationId,
        });

      if (existing) {
        existing.update({ memberIds: resolvedMemberIds });
        await this.conversationRepository.save(existing);
        continue;
      }

      const conversation = Conversation.create({
        accountId: account.getId(),
        slackConversationId: sc.slackConversationId,
        memberIds: resolvedMemberIds,
        isGroupDm: sc.isGroupDm,
      });
      await this.conversationRepository.save(conversation);
    }
  }

  private async resolveMembers(
    memberSlackIds: string[],
  ): Promise<string[] | null> {
    const ids: string[] = [];
    for (const slackUserId of memberSlackIds) {
      const user = await this.userRepository.findBySlackId(slackUserId);
      if (!user) return null;
      ids.push(user.getId());
    }
    return ids;
  }

  private async findOrCreateUser(slackUser: {
    slackId: string;
    email: string | null;
    name: string;
  }): Promise<User> {
    const existing = await this.userRepository.findBySlackId(slackUser.slackId);
    if (existing) return existing;

    const user = User.createFromSlack({
      slackId: slackUser.slackId,
      email: slackUser.email ?? `${slackUser.slackId}@slack.placeholder`,
      name: slackUser.name,
    });

    await this.userRepository.save(user);
    return user;
  }
}
