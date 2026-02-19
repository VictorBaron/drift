import { Entity, Property, Unique } from '@mikro-orm/core';
import { PersistenceEntity } from 'common/persistence-entity';
import type { OwnPersistenceEntityProperties } from 'common/types/misc';

@Entity({ tableName: 'account' })
export class AccountMikroOrm extends PersistenceEntity {
  @Property({ type: 'varchar', length: 255 })
  name: string;

  @Property({ type: 'varchar', length: 255 })
  @Unique()
  slackTeamId: string;

  static build(props: OwnPersistenceEntityProperties<AccountMikroOrm>): AccountMikroOrm {
    return Object.assign(new AccountMikroOrm(), props);
  }
}
