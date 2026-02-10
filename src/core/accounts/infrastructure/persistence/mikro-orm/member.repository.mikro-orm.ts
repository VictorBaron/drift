import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Repository } from 'src/common/domain';
import {
  Member,
  MemberRepository,
  MemberRoleLevel,
} from 'src/core/accounts/domain';

import { MemberMapper } from './mappers';
import { MemberMikroOrm } from './models';

@Injectable()
export class MemberRepositoryMikroOrm
  extends Repository<Member, MemberMikroOrm>
  implements MemberRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, MemberMapper, MemberMikroOrm);
  }

  async findById(id: string): Promise<Member | null> {
    const entity = await this.em.findOne(MemberMikroOrm, { id });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findByAccountId(accountId: string): Promise<Member[]> {
    const entities = await this.em.find(
      MemberMikroOrm,
      { accountId },
      { orderBy: { createdAt: 'ASC' } },
    );
    return entities.map((e) => MemberMapper.toDomain(e));
  }

  async findByUserId(userId: string): Promise<Member[]> {
    const entities = await this.em.find(
      MemberMikroOrm,
      { userId },
      { orderBy: { createdAt: 'ASC' } },
    );
    return entities.map((e) => MemberMapper.toDomain(e));
  }

  async findByAccountIdAndUserId(props: {
    accountId: string;
    userId: string;
  }): Promise<Member | null> {
    const entity = await this.em.findOne(MemberMikroOrm, {
      accountId: props.accountId,
      userId: props.userId,
    });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findPendingByUserId(userId: string): Promise<Member[]> {
    const entities = await this.em.find(
      MemberMikroOrm,
      {
        userId,
        activatedAt: null,
        disabledAt: null,
      },
      { orderBy: { invitedAt: 'DESC' } },
    );
    return entities.map((e) => MemberMapper.toDomain(e));
  }

  async findActiveAdminsByAccountId(accountId: string): Promise<Member[]> {
    const entities = await this.em.find(MemberMikroOrm, {
      accountId,
      role: MemberRoleLevel.ADMIN,
      activatedAt: { $ne: null },
      disabledAt: null,
    });
    return entities.map((e) => MemberMapper.toDomain(e));
  }
}
