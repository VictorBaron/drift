import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Repository } from 'src/common/domain';
import { Account, AccountRepository } from 'src/core/accounts/domain';

import { AccountMapper } from './mappers';
import { AccountMikroOrm } from './models';

@Injectable()
export class AccountRepositoryMikroOrm
  extends Repository<Account, AccountMikroOrm>
  implements AccountRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, AccountMapper, AccountMikroOrm);
  }

  async findById(id: string): Promise<Account | null> {
    const entity = await this.em.findOne(AccountMikroOrm, { id });
    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Account[]> {
    const entities = await this.em.find(
      AccountMikroOrm,
      {},
      { orderBy: { name: 'ASC' } },
    );
    return entities.map((e) => AccountMapper.toDomain(e));
  }
}
