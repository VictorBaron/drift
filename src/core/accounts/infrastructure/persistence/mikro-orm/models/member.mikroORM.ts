import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { PersistenceEntity } from 'src/common/persistence-entity';
import { MemberRoleLevel } from 'src/core/accounts/domain';

@Entity({ tableName: 'member' })
@Unique({ properties: ['accountId', 'userId'] })
@Index({ properties: ['accountId'], name: 'idx_member_accountId' })
@Index({ properties: ['userId'], name: 'idx_member_userId' })
export class MemberMikroOrm extends PersistenceEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string;

  @Property({ type: 'uuid' })
  accountId: string;

  @Property({ type: 'uuid' })
  userId: string;

  @Property({ type: 'varchar', length: 50 })
  role: MemberRoleLevel;

  @Property({ type: 'timestamptz', nullable: true })
  invitedAt: Date | null;

  @Property({ type: 'timestamptz', nullable: true })
  activatedAt: Date | null;

  @Property({ type: 'timestamptz', nullable: true })
  disabledAt: Date | null;

  @Property({ type: 'uuid', nullable: true })
  invitedById: string | null;

  @Property({ type: 'timestamptz', nullable: true })
  lastActiveAt: Date | null;

  @Property({ type: 'jsonb' })
  preferences: Record<string, unknown>;

  @Property({ type: 'timestamptz' })
  createdAt: Date;

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt: Date;

  @Property({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
