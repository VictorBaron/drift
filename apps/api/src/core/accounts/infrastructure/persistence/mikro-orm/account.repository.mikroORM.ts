import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RepositoryMikroORM } from 'common/domain';
import { Account, AccountRepository } from '@/accounts/domain';

import { AccountMapper } from './mappers';
import { AccountMikroOrm } from './models';

@Injectable()
export class AccountRepositoryMikroOrm
  extends RepositoryMikroORM<Account, AccountMikroOrm>
  implements AccountRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, AccountMapper, AccountMikroOrm);
  }

  async findById(id: string): Promise<Account | null> {
    const entity = await this.em.findOne(AccountMikroOrm, { id });
    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async findBySlackTeamId(teamId: string): Promise<Account | null> {
    const entity = await this.em.findOne(AccountMikroOrm, {
      slackTeamId: teamId,
    });
    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Account[]> {
    const entities = await this.em.find(AccountMikroOrm, {}, { orderBy: { name: 'ASC' } });
    return entities.map((e) => AccountMapper.toDomain(e));
  }
}
