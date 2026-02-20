import { RepositoryPort } from 'common/domain/repository-port';
import type { Account } from '@/accounts/domain';

export abstract class AccountRepository extends RepositoryPort<Account> {
  abstract findById(id: string): Promise<Account | null>;
  abstract findBySlackTeamId(teamId: string): Promise<Account | null>;
  abstract findAll(): Promise<Account[]>;
  abstract save(account: Account): Promise<void>;
  abstract softDelete(account: Account): Promise<void>;
}
