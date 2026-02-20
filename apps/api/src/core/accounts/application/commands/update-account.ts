import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'common/application/command-handler';
import { Account, AccountRepository, Member } from '@/accounts/domain';

export class UpdateAccountCommand {
  constructor(
    readonly props: {
      accountId: string;
      name: string;
      actor: Member;
    },
  ) {}
}

@CommandHandler(UpdateAccountCommand)
export class UpdateAccount extends BaseCommand<UpdateAccountCommand> {
  constructor(private readonly accountRepository: AccountRepository) {
    super();
  }

  async execute(command: UpdateAccountCommand): Promise<Account> {
    const { accountId, name, actor } = command.props;

    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!actor.isAdmin() || !actor.isActive()) {
      throw new ForbiddenException('Only active admins can update account details');
    }

    account.updateName(name);
    await this.accountRepository.save(account);

    return account;
  }
}
