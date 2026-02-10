import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { PersistenceEntity } from 'src/common/persistence-entity';

@Entity({ tableName: 'account' })
export class AccountMikroOrm extends PersistenceEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string;

  @Property({ type: 'varchar', length: 255 })
  name: string;

  @Property({ type: 'timestamptz' })
  createdAt: Date;

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt: Date;

  @Property({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
