import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'common/application/command-handler';
import { Account, AccountRepository, Member, MemberRepository } from '@/accounts/domain';
import { UserRepository } from '@/users/domain';

export class CreateAccountCommand {
  constructor(
    readonly props: {
      name: string;
      creatorUserId: string;
      slackTeamId: string;
    },
  ) {}
}

@CommandHandler(CreateAccountCommand)
export class CreateAccount extends BaseCommand<CreateAccountCommand> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly memberRepository: MemberRepository,
    private readonly userRepository: UserRepository,
  ) {
    super();
  }

  async execute(command: CreateAccountCommand): Promise<Account> {
    const { name, creatorUserId, slackTeamId } = command.props;

    const account = Account.create({
      name,
      slackTeamId,
    });

    const creatorUser = await this.userRepository.findById(creatorUserId);
    if (!creatorUser) {
      this.logger.error(`Could not find creator user when creating account: ${JSON.stringify(command.props)}`);
      throw new Error('Could not find creator user when creating account');
    }

    const founder = Member.createFounder({
      accountId: account.getId(),
      user: creatorUser,
    });

    await this.accountRepository.save(account);
    await this.memberRepository.save(founder);

    return account;
  }
}
