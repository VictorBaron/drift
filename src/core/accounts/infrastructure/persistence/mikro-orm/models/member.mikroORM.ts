import { Collection, Entity, Index, ManyToMany, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { PersistenceEntity } from 'common/persistence-entity';
import type { OwnPersistenceEntityProperties } from 'common/types/misc';

import type { MemberRoleLevel } from '@/accounts/domain';
import { ChannelMikroOrm } from '@/channels/infrastructure/persistence/mikro-orm';
import { ConversationMikroOrm } from '@/conversations/infrastructure/persistence/mikro-orm';
import { UserMikroOrm } from '@/users/infrastructure/persistence/mikro-orm';
import { AccountMikroOrm } from './account.mikroORM';

@Entity({ tableName: 'member' })
@Unique({ properties: ['account', 'user'] })
@Index({ properties: ['account'], name: 'idx_member_accountId' })
@Index({ properties: ['user'], name: 'idx_member_userId' })
export class MemberMikroOrm extends PersistenceEntity {
  @ManyToOne(() => AccountMikroOrm)
  account?: AccountMikroOrm;

  @ManyToOne(() => UserMikroOrm)
  user?: UserMikroOrm;

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

  @ManyToMany(
    () => ConversationMikroOrm,
    (conversation) => conversation.members,
  )
  conversations = new Collection<ConversationMikroOrm>(this);

  @ManyToMany(
    () => ChannelMikroOrm,
    (channel) => channel.members,
  )
  channels = new Collection<ChannelMikroOrm>(this);

  static build(props: OwnPersistenceEntityProperties<MemberMikroOrm>): MemberMikroOrm {
    return Object.assign(new MemberMikroOrm(), props);
  }
}
