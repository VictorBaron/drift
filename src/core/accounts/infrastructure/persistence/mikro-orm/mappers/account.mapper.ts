import { Account } from 'src/core/accounts/domain';
import { AccountMikroOrm } from 'src/core/accounts/infrastructure/persistence/mikro-orm';

export class AccountMapper {
  static toDomain(raw: AccountMikroOrm): Account {
    return Account.reconstitute({
      id: raw.id,
      name: raw.name,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(account: Account): AccountMikroOrm {
    const json = account.toJSON();
    const entity = new AccountMikroOrm();
    entity.id = json.id;
    entity.name = json.name;
    entity.createdAt = json.createdAt;
    entity.updatedAt = json.updatedAt;
    entity.deletedAt = json.deletedAt;
    return entity;
  }
}
