import { Injectable } from '@nestjs/common';
import {
  Account,
  AccountRepository,
  MemberRepository,
} from 'src/core/accounts/domain';

export class GetUserAccountsQuery {
  constructor(readonly userId: string) {}
}

@Injectable()
export class GetUserAccountsHandler {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(query: GetUserAccountsQuery): Promise<Account[]> {
    const members = await this.memberRepository.findByUserId(query.userId);

    const activeMembers = members.filter(
      (member) => !member.isDisabled() && !member.isPending(),
    );

    if (activeMembers.length === 0) {
      return [];
    }

    const accountIds = activeMembers.map((member) => member.getAccountId());
    const accounts = await Promise.all(
      accountIds.map((id) => this.accountRepository.findById(id)),
    );

    return accounts.filter((account): account is Account => account !== null);
  }
}
