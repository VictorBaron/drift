import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { PersistenceEntity } from 'common/persistence-entity';
import type { OwnPersistenceEntityProperties } from 'common/types/misc';
import { OrganizationMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/organization.mikroORM';
import { ProjectMikroOrm } from '@/projects/infrastructure/persistence/mikro-orm/models/project.mikroORM';
import type { DriftLevel, ProjectHealth, ReportContent } from '@/reports/domain/aggregates/report.aggregate';

@Entity({ tableName: 'report' })
@Index({ properties: ['project', 'generatedAt'] })
export class ReportMikroOrm extends PersistenceEntity {
  @ManyToOne(() => OrganizationMikroOrm)
  organization: OrganizationMikroOrm;

  @ManyToOne(() => OrganizationMikroOrm)
  project: ProjectMikroOrm;

  @Property({ type: 'timestamptz' })
  weekStart: Date;

  @Property({ type: 'timestamptz' })
  weekEnd: Date;

  @Property({ type: 'int' })
  weekNumber: number;

  @Property({ type: 'varchar', length: 100 })
  periodLabel: string;

  @Property({ type: 'jsonb' })
  content: ReportContent;

  @Property({ type: 'varchar', length: 20 })
  health: ProjectHealth;

  @Property({ type: 'varchar', length: 20 })
  driftLevel: DriftLevel;

  @Property({ type: 'int' })
  progress: number;

  @Property({ type: 'int' })
  prevProgress: number;

  @Property({ type: 'int' })
  slackMessageCount: number;

  @Property({ type: 'int' })
  linearTicketCount: number;

  @Property({ type: 'int' })
  notionPagesRead: number;

  @Property({ type: 'varchar', length: 100 })
  modelUsed: string;

  @Property({ type: 'int' })
  promptTokens: number;

  @Property({ type: 'int' })
  completionTokens: number;

  @Property({ type: 'int' })
  generationTimeMs: number;

  @Property({ type: 'timestamptz' })
  generatedAt: Date;

  @Property({ type: 'timestamptz', nullable: true })
  slackDeliveredAt: Date | null;

  @Property({ type: 'varchar', length: 255, nullable: true })
  slackMessageTs: string | null;

  static build(props: OwnPersistenceEntityProperties<ReportMikroOrm>): ReportMikroOrm {
    return Object.assign(new ReportMikroOrm(), props);
  }
}
