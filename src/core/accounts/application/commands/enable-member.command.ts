import { Injectable, NotFoundException } from '@nestjs/common';
import { Member, MemberRepository } from 'src/core/accounts/domain';

export class EnableMemberCommand {
  constructor(
    readonly props: {
      accountId: string;
      memberId: string;
      actor: Member;
    },
  ) {}
}

@Injectable()
export class EnableMemberHandler {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(command: EnableMemberCommand): Promise<Member> {
    const { accountId, memberId, actor } = command.props;

    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.getAccountId() !== accountId) {
      throw new NotFoundException('Member not found in this account');
    }

    member.enable({ activatedBy: actor });
    await this.memberRepository.save(member);

    return member;
  }
}
