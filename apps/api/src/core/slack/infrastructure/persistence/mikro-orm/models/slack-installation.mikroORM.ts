import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { PersistenceEntity } from 'common/persistence-entity';
import type { OwnPersistenceEntityProperties } from 'common/types/misc';

@Entity({ tableName: 'slack_installation' })
@Unique({ properties: ['teamId', 'enterpriseId'] })
export class SlackInstallationMikroOrm extends PersistenceEntity {
  @Property({ type: 'varchar', length: 255, nullable: true })
  @Index()
  teamId: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  teamName: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  @Index()
  enterpriseId: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  enterpriseName: string | null;

  @Property({ type: 'varchar', length: 255 })
  @Index()
  userId: string;

  @Property({ type: 'text', nullable: true })
  botToken: string | null;

  @Property({ type: 'text', nullable: true })
  userToken: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  botId: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  botUserId: string | null;

  @Property({ type: 'varchar', length: 50, nullable: true })
  tokenType: string | null;

  @Property({ type: 'boolean', default: false })
  isEnterpriseInstall: boolean;

  @Property({ type: 'jsonb' })
  rawInstallation: Record<string, unknown>;

  @Property({ type: 'timestamptz' })
  installedAt: Date;

  static build(props: OwnPersistenceEntityProperties<SlackInstallationMikroOrm>): SlackInstallationMikroOrm {
    return Object.assign(new SlackInstallationMikroOrm(), props);
  }
}
