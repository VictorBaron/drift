import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Member,
  MemberRepository,
  MemberRole,
  MemberRoleLevel,
} from 'src/core/accounts/domain';

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

@Injectable()
export class ChangeMemberRoleHandler {
  constructor(private readonly memberRepository: MemberRepository) {}

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
