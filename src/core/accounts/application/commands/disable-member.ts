import { NotFoundException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'src/common/application/command-handler';
import { Member, MemberRepository } from '@/accounts/domain';

export class DisableMemberCommand {
  constructor(
    readonly props: {
      accountId: string;
      memberId: string;
      actor: Member;
    },
  ) {}
}

@CommandHandler(DisableMemberCommand)
export class DisableMember extends BaseCommand<DisableMemberCommand> {
  constructor(private readonly memberRepository: MemberRepository) {
    super();
  }

  async execute(command: DisableMemberCommand): Promise<Member> {
    const { actor, memberId } = command.props;

    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    member.disable(actor);
    await this.memberRepository.save(member);

    return member;
  }
}
