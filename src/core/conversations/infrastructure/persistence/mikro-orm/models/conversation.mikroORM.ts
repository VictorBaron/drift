import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { PersistenceEntity } from 'common/persistence-entity';
import type { OwnPersistenceEntityProperties } from 'common/types/misc';
import { AccountMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm';

@Entity({ tableName: 'conversation' })
@Unique({ properties: ['account', 'slackConversationId'] })
export class ConversationMikroOrm extends PersistenceEntity {
  @ManyToOne(() => AccountMikroOrm)
  account?: AccountMikroOrm;

  @Property({ type: 'varchar', length: 255 })
  slackConversationId: string;

  @Property({ type: 'jsonb' })
  memberIds: string[];

  @Property({ type: 'boolean', default: false })
  isGroupDm: boolean;

  static build(
    props: OwnPersistenceEntityProperties<ConversationMikroOrm>,
  ): ConversationMikroOrm {
    return Object.assign(new ConversationMikroOrm(), props);
  }
}
