import { Account } from 'src/core/accounts/domain';
import { AccountTypeOrm } from 'src/core/accounts/infrastructure/persistence/typeorm';

export class AccountMapper {
  static toDomain(raw: AccountTypeOrm): Account {
    return Account.reconstitute({
      id: raw.id,
      name: raw.name,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(account: Account): AccountTypeOrm {
    const json = account.toJSON();
    return AccountTypeOrm.build({
      id: json.id,
      name: json.name,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      deletedAt: json.deletedAt,
    });
  }
}
