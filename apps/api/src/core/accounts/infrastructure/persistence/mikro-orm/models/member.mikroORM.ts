import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { PersistenceEntity } from 'common/persistence-entity';
import type { OwnPersistenceEntityProperties } from 'common/types/misc';
import { OrganizationMikroOrm } from './organization.mikroORM';

@Entity({ tableName: 'member' })
export class MemberMikroOrm extends PersistenceEntity {
  @Property({ type: 'varchar', length: 255 })
  @Unique()
  email: string;

  @Property({ type: 'varchar', length: 255 })
  name: string;

  @Property({ type: 'varchar', length: 255 })
  slackUserId: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Property({ type: 'varchar', length: 50 })
  role: string;

  @ManyToOne(() => OrganizationMikroOrm)
  organization: OrganizationMikroOrm;

  static build(props: OwnPersistenceEntityProperties<MemberMikroOrm>): MemberMikroOrm {
    return Object.assign(new MemberMikroOrm(), props);
  }
}
