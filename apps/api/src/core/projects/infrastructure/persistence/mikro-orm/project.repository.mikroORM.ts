import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';

import type { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';

import { ProjectMapper } from './mappers/project.mapper';
import { ProjectMikroOrm } from './models/project.mikroORM';

@Injectable()
export class ProjectRepositoryMikroOrm
  extends RepositoryMikroORM<Project, ProjectMikroOrm>
  implements ProjectRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, ProjectMapper, ProjectMikroOrm);
  }

  async findById(id: string): Promise<Project | null> {
    const entity = await this.em.findOne(ProjectMikroOrm, { id, deletedAt: null });
    return entity ? ProjectMapper.toDomain(entity) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Project[]> {
    const entities = await this.em.find(ProjectMikroOrm, { organization: { id: organizationId }, deletedAt: null });
    return entities.map(ProjectMapper.toDomain);
  }

  async findActiveByOrganizationId(organizationId: string): Promise<Project[]> {
    const entities = await this.em.find(ProjectMikroOrm, {
      organization: { id: organizationId },
      isActive: true,
      deletedAt: null,
    });
    return entities.map(ProjectMapper.toDomain);
  }
}
