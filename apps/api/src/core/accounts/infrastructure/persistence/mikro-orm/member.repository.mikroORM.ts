import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';
import { type Member, MemberRepository, MemberRoleLevel } from '@/accounts/domain';

import { MemberMapper } from './mappers';
import { MemberMikroOrm } from './models';

@Injectable()
export class MemberRepositoryMikroOrm
  extends RepositoryMikroORM<Member, MemberMikroOrm, 'user'>
  implements MemberRepository
{
  protected override readonly defaultPopulate = ['user'] as const;

  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, MemberMapper, MemberMikroOrm);
  }

  async findById(id: string): Promise<Member | null> {
    const entity = await this.findOne({ id });
    return this.mapToDomain(entity);
  }

  async findByAccountId(accountId: string): Promise<Member[]> {
    const entities = await this.find({ account: accountId }, { orderBy: { createdAt: 'ASC' } });
    return this.mapArrayToDomain(entities);
  }

  async findByAccountIdAndSlackUserId({
    accountId,
    slackUserId,
  }: {
    accountId: string;
    slackUserId: string;
  }): Promise<Member | null> {
    const entity = await this.findOne({
      account: accountId,
      user: { slackId: slackUserId },
    });
    return this.mapToDomain(entity);
  }

  async findByUserId(userId: string): Promise<Member[]> {
    const entities = await this.find({ user: userId }, { orderBy: { createdAt: 'ASC' } });
    return this.mapArrayToDomain(entities);
  }

  async findByAccountIdAndUserId(props: { accountId: string; userId: string }): Promise<Member | null> {
    const entity = await this.findOne({
      account: props.accountId,
      user: props.userId,
    });
    return this.mapToDomain(entity);
  }

  async findPendingByUserId(userId: string): Promise<Member[]> {
    const entities = await this.find(
      {
        user: userId,
        activatedAt: null,
        disabledAt: null,
      },
      { orderBy: { invitedAt: 'DESC' } },
    );
    return this.mapArrayToDomain(entities);
  }

  async findActiveAdminsByAccountId(accountId: string): Promise<Member[]> {
    const entities = await this.find({
      account: accountId,
      role: MemberRoleLevel.ADMIN,
      activatedAt: { $ne: null },
      disabledAt: null,
    });
    return this.mapArrayToDomain(entities);
  }

  async findManyByIds(ids: string[]): Promise<Member[]> {
    if (ids.length === 0) return [];
    const entities = await this.find({ id: { $in: ids } });
    return this.mapArrayToDomain(entities);
  }

  async findManyByAccountIdAndSlackUserIds({
    accountId,
    slackUserIds,
  }: {
    accountId: string;
    slackUserIds: string[];
  }): Promise<Member[]> {
    if (slackUserIds.length === 0) return [];
    const entities = await this.find({
      account: accountId,
      user: { slackId: { $in: slackUserIds } },
    });
    return this.mapArrayToDomain(entities);
  }

  async findAll(): Promise<Member[]> {
    const entities = await this.find({});
    return this.mapArrayToDomain(entities);
  }
}
