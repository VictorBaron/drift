import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { PersistenceEntity } from 'common/persistence-entity';
import type { OwnPersistenceEntityProperties } from 'common/types/misc';
import { OrganizationMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/organization.mikroORM';
import type { KeyResult } from '@/projects/domain/aggregates/project.aggregate';

@Entity({ tableName: 'project' })
export class ProjectMikroOrm extends PersistenceEntity {
  @Property({ type: 'varchar', length: 1023 })
  name: string;

  @Property({ type: 'varchar', length: 10 })
  emoji: string;

  @ManyToOne(() => OrganizationMikroOrm)
  organization: OrganizationMikroOrm;

  @Property({ type: 'varchar', length: 255, nullable: true })
  pmLeadName: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  techLeadName: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  teamName: string | null;

  @Property({ type: 'timestamptz', nullable: true })
  targetDate: Date | null;

  @Property({ type: 'int' })
  weekNumber: number;

  @Property({ type: 'jsonb' })
  slackChannelIds: string[];

  @Property({ type: 'varchar', length: 255, nullable: true })
  linearProjectId: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  linearTeamId: string | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  notionPageId: string | null;

  @Property({ type: 'text', nullable: true })
  productObjective: string | null;

  @Property({ type: 'text', nullable: true })
  objectiveOrigin: string | null;

  @Property({ type: 'jsonb', nullable: true })
  keyResults: KeyResult[] | null;

  @Property({ type: 'boolean' })
  isActive: boolean;

  static build(props: OwnPersistenceEntityProperties<ProjectMikroOrm>): ProjectMikroOrm {
    return Object.assign(new ProjectMikroOrm(), props);
  }
}
