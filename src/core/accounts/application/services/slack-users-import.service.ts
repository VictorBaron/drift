import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';
import { Account, Member, MemberRepository } from '@/accounts/domain';
import {
  SLACK_USERS_GATEWAY,
  SlackUserInfo,
  type SlackUsersGateway,
} from '@/accounts/domain/gateways/slack-users.gateway';
import { User, UserRepository } from '@/users/domain';

@Injectable()
export class SlackUsersImportService extends BaseService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly userRepository: UserRepository,
    @Inject(SLACK_USERS_GATEWAY)
    private readonly slackUsersGateway: SlackUsersGateway,
  ) {
    super();
  }

  async importUsers({
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
