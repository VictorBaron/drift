import { Account, AccountProps } from 'src/core/accounts/domain';

export class AccountFactory {
  static create(overrides?: Partial<AccountProps>): Account {
    return Account.reconstitute({
      id: 'accountId',
      name: 'Test Account',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      deletedAt: null,
      ...overrides,
    });
  }
}
