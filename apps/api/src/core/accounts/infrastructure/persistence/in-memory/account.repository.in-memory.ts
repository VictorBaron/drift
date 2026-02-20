import { RepositoryInMemory } from 'common/domain/repository.in-memory';
import { Account, AccountRepository } from '@/accounts/domain';

export class AccountRepositoryInMemory extends RepositoryInMemory<Account> implements AccountRepository {
  findBySlackTeamId(teamId: string): Promise<Account | null> {
    return this.find((account) => account.toJSON().slackTeamId === teamId) ?? null;
  }
}
