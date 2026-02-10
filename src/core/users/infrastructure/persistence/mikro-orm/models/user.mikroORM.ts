import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { PersistenceEntity } from 'src/common/persistence-entity';

@Entity({ tableName: 'user' })
export class UserMikroOrm extends PersistenceEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string;

  @Property({ type: 'varchar', length: 255 })
  @Unique()
  email: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  @Unique()
  @Index()
  googleId: string | null;

  @Property({ type: 'timestamptz' })
  createdAt: Date;

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt: Date;

  @Property({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
