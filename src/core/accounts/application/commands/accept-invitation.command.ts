import { Injectable, NotFoundException } from '@nestjs/common';
import { Member, MemberRepository } from 'src/core/accounts/domain';

export class AcceptInvitationCommand {
  constructor(
    readonly props: {
      accountId: string;
      actor: Member;
    },
  ) {}
}

@Injectable()
export class AcceptInvitationHandler {
  constructor(private readonly memberRepository: MemberRepository) {}

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
