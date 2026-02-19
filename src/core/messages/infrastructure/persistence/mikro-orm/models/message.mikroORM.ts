import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { GenericMessageEvent } from '@slack/types';
import { PersistenceEntity } from 'common/persistence-entity';
import type { OwnPersistenceEntityProperties } from 'common/types/misc';
import { AccountMikroOrm, MemberMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm';

@Entity({ tableName: 'message' })
export class MessageMikroOrm extends PersistenceEntity {
  @ManyToOne(() => AccountMikroOrm)
  account?: AccountMikroOrm;

  @ManyToOne(() => MemberMikroOrm)
  sender?: MemberMikroOrm;

  @Property({ type: 'varchar', length: 64 })
  @Index()
  slackTs: string;

  @Property({ type: 'varchar', length: 64 })
  slackChannelId: string;

  @Property({ type: 'varchar', length: 32 })
  slackChannelType: GenericMessageEvent['channel_type'];

  @Property({ type: 'varchar', length: 64, nullable: true })
  slackThreadTs: string | null;

  @Property({ type: 'text', nullable: true })
  text: string | null;

  @Property({ type: 'smallint', nullable: true })
  urgencyScore: number | null;

  @Property({ type: 'text', nullable: true })
  urgencyReasoning: string | null;

  static build(props: OwnPersistenceEntityProperties<MessageMikroOrm>): MessageMikroOrm {
    return Object.assign(new MessageMikroOrm(), props);
  }
}
