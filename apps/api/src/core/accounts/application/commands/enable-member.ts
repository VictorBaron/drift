import { NotFoundException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'common/application/command-handler';
import { Member, MemberRepository } from '@/accounts/domain';

export class EnableMemberCommand {
  constructor(
    readonly props: {
      accountId: string;
      memberId: string;
      actor: Member;
    },
  ) {}
}

@CommandHandler(EnableMemberCommand)
export class EnableMember extends BaseCommand<EnableMemberCommand> {
  constructor(private readonly memberRepository: MemberRepository) {
    super();
  }

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
