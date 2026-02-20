import { Account } from '@/accounts/domain';
import { AccountMikroOrm } from '../models/account.mikroORM';

export class AccountMapper {
  static toDomain(raw: AccountMikroOrm): Account {
    return Account.reconstitute({
      id: raw.id,
      name: raw.name,
      slackTeamId: raw.slackTeamId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(account: Account): AccountMikroOrm {
    const json = account.toJSON();
    const entity = AccountMikroOrm.build({
      ...json,
    });

    return entity;
  }
}
