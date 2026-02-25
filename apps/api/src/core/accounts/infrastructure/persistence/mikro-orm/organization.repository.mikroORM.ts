import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';

import type { Organization } from '@/accounts/domain/aggregates/organization.aggregate';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';

import { OrganizationMapper } from './mappers/organization.mapper';
import { OrganizationMikroOrm } from './models/organization.mikroORM';

@Injectable()
export class OrganizationRepositoryMikroOrm
  extends RepositoryMikroORM<Organization, OrganizationMikroOrm>
  implements OrganizationRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, OrganizationMapper, OrganizationMikroOrm);
  }

  async findAll(): Promise<Organization[]> {
    const entities = await this.em.find(OrganizationMikroOrm, { deletedAt: null });
    return entities.map(OrganizationMapper.toDomain);
  }

  async findById(id: string): Promise<Organization | null> {
    const entity = await this.em.findOne(OrganizationMikroOrm, { id, deletedAt: null });
    return entity ? OrganizationMapper.toDomain(entity) : null;
  }

  async findBySlackTeamId(slackTeamId: string): Promise<Organization | null> {
    const entity = await this.em.findOne(OrganizationMikroOrm, { slackTeamId, deletedAt: null });
    return entity ? OrganizationMapper.toDomain(entity) : null;
  }
}
