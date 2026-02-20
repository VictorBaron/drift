import { NotFoundException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'common/application/command-handler';
import { Member, MemberRepository } from '@/accounts/domain';

export class AcceptInvitationCommand {
  constructor(
    readonly props: {
      accountId: string;
      actor: Member;
    },
  ) {}
}

@CommandHandler(AcceptInvitationCommand)
export class AcceptInvitation extends BaseCommand<AcceptInvitationCommand> {
  constructor(private readonly memberRepository: MemberRepository) {
    super();
  }

  async execute(command: AcceptInvitationCommand): Promise<Member> {
    const { actor } = command.props;

    if (actor.getAccountId() !== command.props.accountId) {
      throw new NotFoundException('Member not found in this account');
    }

    actor.activate();
    await this.memberRepository.save(actor);

    return actor;
  }
}
