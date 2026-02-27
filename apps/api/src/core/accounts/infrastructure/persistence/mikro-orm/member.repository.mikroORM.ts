import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';

import type { Member } from '@/accounts/domain/aggregates/member.aggregate';
import { MemberRepository } from '@/accounts/domain/repositories/member.repository';

import { MemberMapper } from './mappers/member.mapper';
import { MemberMikroOrm } from './models/member.mikroORM';

@Injectable()
export class MemberRepositoryMikroOrm extends RepositoryMikroORM<Member, MemberMikroOrm> implements MemberRepository {
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, MemberMapper, MemberMikroOrm);
  }

  async findById(id: string): Promise<Member | null> {
    const entity = await this.em.findOne(MemberMikroOrm, { id, deletedAt: null });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<Member | null> {
    const entity = await this.em.findOne(MemberMikroOrm, { email, deletedAt: null });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findBySlackUserId(slackUserId: string): Promise<Member | null> {
    const entity = await this.em.findOne(MemberMikroOrm, { slackUserId, deletedAt: null });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Member[]> {
    const entities = await this.em.find(MemberMikroOrm, { organization: { id: organizationId }, deletedAt: null });
    return entities.map(MemberMapper.toDomain);
  }
}
