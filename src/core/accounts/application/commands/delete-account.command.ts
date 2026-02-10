import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountRepository, Member } from 'src/core/accounts/domain';

export class DeleteAccountCommand {
  constructor(
    readonly props: {
      accountId: string;
      actor: Member;
    },
  ) {}
}

@Injectable()
export class DeleteAccountHandler {
  constructor(private readonly accountRepository: AccountRepository) {}

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
