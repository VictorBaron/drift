import { Account, type AccountProps } from '@/accounts/domain';

export class AccountFactory {
  static create(overrides?: Partial<AccountProps>): Account {
    return Account.reconstitute({
      id: 'accountId',
      name: 'Test Account',
      slackTeamId: 'T_TEST',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      deletedAt: null,
      ...overrides,
    });
  }
}
