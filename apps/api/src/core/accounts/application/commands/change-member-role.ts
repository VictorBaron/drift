import { NotFoundException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'common/application/command-handler';
import { type Member, MemberRepository, MemberRole, type MemberRoleLevel } from '@/accounts/domain';

export class ChangeMemberRoleCommand {
  constructor(
    readonly props: {
      accountId: string;
      memberId: string;
      role: MemberRoleLevel;
      actor: Member;
    },
  ) {}
}

@CommandHandler(ChangeMemberRoleCommand)
export class ChangeMemberRole extends BaseCommand<ChangeMemberRoleCommand> {
  constructor(private readonly memberRepository: MemberRepository) {
    super();
  }

  async execute(command: ChangeMemberRoleCommand): Promise<Member> {
    const { actor, memberId } = command.props;

    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const newRole = MemberRole.create(command.props.role);

    member.changeRole({ role: newRole, actor });
    await this.memberRepository.save(member);

    return member;
  }
}
