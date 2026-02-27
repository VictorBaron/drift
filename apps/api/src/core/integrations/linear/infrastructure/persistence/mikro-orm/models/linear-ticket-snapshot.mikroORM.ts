import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { PersistenceEntity } from 'common/persistence-entity';
import type { OwnPersistenceEntityProperties } from 'common/types/misc';
import { OrganizationMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/organization.mikroORM';
import { ProjectMikroOrm } from '@/projects/infrastructure/persistence/mikro-orm/models/project.mikroORM';

@Entity({ tableName: 'linear_ticket_snapshot' })
@Index({ properties: ['project', 'snapshotWeekStart'] })
@Index({ properties: ['linearIssueId', 'snapshotDate'] })
export class LinearTicketSnapshotMikroOrm extends PersistenceEntity {
  @ManyToOne(() => OrganizationMikroOrm)
  organization: OrganizationMikroOrm;

  @ManyToOne(() => ProjectMikroOrm, { nullable: true })
  project: ProjectMikroOrm | null;

  @Property({ type: 'varchar', length: 255 })
  linearIssueId: string;

  @Property({ type: 'varchar', length: 50 })
  identifier: string;

  @Property({ type: 'text' })
  title: string;

  @Property({ type: 'text', nullable: true })
  description: string | null;

  @Property({ type: 'varchar', length: 100 })
  stateName: string;

  @Property({ type: 'varchar', length: 50 })
  stateType: string;

  @Property({ type: 'int' })
  priority: number;

  @Property({ type: 'varchar', length: 255, nullable: true })
  assigneeName: string | null;

  @Property({ type: 'jsonb' })
  labelNames: string[];

  @Property({ type: 'int' })
  commentCount: number;

  @Property({ type: 'timestamptz' })
  snapshotDate: Date;

  @Property({ type: 'timestamptz' })
  snapshotWeekStart: Date;

  static build(props: OwnPersistenceEntityProperties<LinearTicketSnapshotMikroOrm>): LinearTicketSnapshotMikroOrm {
    return Object.assign(new LinearTicketSnapshotMikroOrm(), props);
  }
}
