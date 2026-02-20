import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { Account, AccountRepository, MemberRepository } from '@/accounts/domain';

export class GetAccountByIdQuery {
  constructor(
    readonly props: {
      accountId: string;
      actorUserId: string;
    },
  ) {}
}

@Injectable()
export class GetAccountById {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(query: GetAccountByIdQuery): Promise<Account> {
    const member = await this.memberRepository.findByAccountIdAndUserId({
      accountId: query.props.accountId,
      userId: query.props.actorUserId,
    });

    if (!member || member.isDisabled()) {
      throw new ForbiddenException('You do not have access to this account');
    }

    const account = await this.accountRepository.findById(query.props.accountId);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }
}
