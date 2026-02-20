import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'common/application/command-handler';
import { AccountRepository, Member } from '@/accounts/domain';

export class DeleteAccountCommand {
  constructor(
    readonly props: {
      accountId: string;
      actor: Member;
    },
  ) {}
}

@CommandHandler(DeleteAccountCommand)
export class DeleteAccount extends BaseCommand<DeleteAccountCommand> {
  constructor(private readonly accountRepository: AccountRepository) {
    super();
  }

  async execute(command: DeleteAccountCommand): Promise<void> {
    const { accountId, actor } = command.props;

    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!actor.isAdmin() || !actor.isActive()) {
      throw new ForbiddenException('Only active admins can delete an account');
    }

    await this.accountRepository.softDelete(account);
  }
}
