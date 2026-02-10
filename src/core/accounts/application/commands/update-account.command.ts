import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account, AccountRepository, Member } from 'src/core/accounts/domain';

export class UpdateAccountCommand {
  constructor(
    readonly props: {
      accountId: string;
      name: string;
      actor: Member;
    },
  ) {}
}

@Injectable()
export class UpdateAccountHandler {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(command: UpdateAccountCommand): Promise<Account> {
    const { accountId, name, actor } = command.props;

    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!actor.isAdmin() || !actor.isActive()) {
      throw new ForbiddenException(
        'Only active admins can update account details',
      );
    }

    account.updateName(name);
    await this.accountRepository.save(account);

    return account;
  }
}
