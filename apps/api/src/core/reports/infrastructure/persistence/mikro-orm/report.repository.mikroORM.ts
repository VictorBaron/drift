import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';

import type { Report } from '@/reports/domain/aggregates/report.aggregate';
import { ReportRepository } from '@/reports/domain/repositories/report.repository';

import { ReportMapper } from './mappers/report.mapper';
import { ReportMikroOrm } from './models/report.mikroORM';

@Injectable()
export class ReportRepositoryMikroOrm extends RepositoryMikroORM<Report, ReportMikroOrm> implements ReportRepository {
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, ReportMapper, ReportMikroOrm);
  }

  async findById(id: string): Promise<Report | null> {
    const entity = await this.em.findOne(ReportMikroOrm, { id, deletedAt: null });
    return entity ? ReportMapper.toDomain(entity) : null;
  }

  async findByProjectAndWeek(projectId: string, weekStart: Date): Promise<Report | null> {
    const entity = await this.em.findOne(ReportMikroOrm, { project: { id: projectId }, weekStart });
    return entity ? ReportMapper.toDomain(entity) : null;
  }

  async findByProjectId(projectId: string): Promise<Report[]> {
    const entities = await this.em.find(
      ReportMikroOrm,
      { project: { id: projectId }, deletedAt: null },
      {
        orderBy: { weekStart: 'DESC' },
      },
    );
    return entities.map(ReportMapper.toDomain);
  }
}
