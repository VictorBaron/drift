import { Injectable } from '@nestjs/common';
import {
  Account,
  AccountRepository,
  Member,
  MemberRepository,
} from 'src/core/accounts/domain';

export class CreateAccountCommand {
  constructor(
    readonly props: {
      name: string;
      creatorUserId: string;
    },
  ) {}
}

@Injectable()
export class CreateAccountHandler {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(command: CreateAccountCommand): Promise<Account> {
    const { name, creatorUserId } = command.props;

    const account = Account.create({
      name,
    });

    const founder = Member.createFounder({
      accountId: account.getId(),
      userId: creatorUserId,
    });

    await this.accountRepository.save(account);
    await this.memberRepository.save(founder);

    return account;
  }
}
