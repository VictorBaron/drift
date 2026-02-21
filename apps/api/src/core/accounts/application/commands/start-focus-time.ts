import { NotFoundException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'common/application/command-handler';
import { AccountRepository, Member, MemberRepository } from '@/accounts/domain';

export class StartFocusTimeCommand {
  constructor(
    readonly props: {
      slackUserId: string;
      teamId: string;
      minutes: number;
    },
  ) {}
}

@CommandHandler(StartFocusTimeCommand)
export class StartFocusTime extends BaseCommand<StartFocusTimeCommand> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly memberRepository: MemberRepository,
  ) {
    super();
  }

  async execute(command: StartFocusTimeCommand): Promise<Member> {
    const { slackUserId, teamId, minutes } = command.props;

    const account = await this.accountRepository.findBySlackTeamId(teamId);
    if (!account) throw new NotFoundException(`No account found for team ${teamId}`);

    const member = await this.memberRepository.findByAccountIdAndSlackUserId({
      accountId: account.id,
      slackUserId,
    });
    if (!member) throw new NotFoundException(`No member found for slackUserId ${slackUserId}`);
    if (!member.isActive()) throw new NotFoundException('Member is not active');

    member.startFocusTime(minutes);
    await this.memberRepository.save(member);

    return member;
  }
}
