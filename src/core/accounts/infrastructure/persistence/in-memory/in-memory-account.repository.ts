import { Account, AccountRepository } from 'src/core/accounts/domain';

export class InMemoryAccountRepository extends AccountRepository {
  private accounts: Map<string, Account> = new Map();

  async findById(id: string): Promise<Account | null> {
    return Promise.resolve(this.accounts.get(id) ?? null);
  }

  async findAll(): Promise<Account[]> {
    return Promise.resolve(Array.from(this.accounts.values()));
  }

  async save(account: Account): Promise<void> {
    this.accounts.set(account.getId(), account);
    return Promise.resolve();
  }

  async softDelete(account: Account): Promise<void> {
    this.accounts.delete(account.getId());
    return Promise.resolve();
  }

  clear(): void {
    this.accounts.clear();
  }
}
