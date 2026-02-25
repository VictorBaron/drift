import { Injectable } from '@nestjs/common';
import { Member } from '@/accounts/domain/aggregates/member.aggregate';
import { Organization } from '@/accounts/domain/aggregates/organization.aggregate';
import { MemberRepository } from '@/accounts/domain/repositories/member.repository';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';

export class RegisterSlackInstallationCommand {
  constructor(
    public readonly teamId: string,
    public readonly teamName: string,
    public readonly encryptedBotToken: string,
    public readonly userId: string,
    public readonly encryptedUserToken: string | null,
    public readonly email: string,
    public readonly name: string,
    public readonly avatarUrl: string | null,
  ) {}
}

export interface RegisterSlackInstallationResult {
  memberId: string;
  orgId: string;
}

@Injectable()
export class RegisterSlackInstallationHandler {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly memberRepo: MemberRepository,
  ) {}

  async execute(command: RegisterSlackInstallationCommand): Promise<RegisterSlackInstallationResult> {
    const { teamId, teamName, encryptedBotToken, userId, encryptedUserToken, email, name, avatarUrl } = command;

    let org = await this.orgRepo.findBySlackTeamId(teamId);
    const orgIsNew = !org;

    if (!org) {
      org = Organization.create({ name: teamName, slackTeamId: teamId, slackBotToken: encryptedBotToken });
    } else {
      org.updateSlackBotToken(encryptedBotToken);
    }

    if (encryptedUserToken) {
      org.addSlackUserToken(userId, encryptedUserToken);
    }

    await this.orgRepo.save(org);

    let member = await this.memberRepo.findBySlackUserId(userId);
    if (!member) {
      member = Member.create({
        email,
        name,
        slackUserId: userId,
        avatarUrl,
        role: orgIsNew ? 'admin' : 'member',
        organizationId: org.getId(),
      });
      await this.memberRepo.save(member);
    }

    return { memberId: member.getId(), orgId: org.getId() };
  }
}
