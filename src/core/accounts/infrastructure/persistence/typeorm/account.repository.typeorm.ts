import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'src/common/domain';
import { Account, AccountRepository } from 'src/core/accounts/domain';
import { Repository as TypeOrmRepository, SelectQueryBuilder } from 'typeorm';

import { AccountMapper } from './mappers';
import { AccountTypeOrm } from './models/account.typeorm';

@Injectable()
export class AccountRepositoryTypeOrm
  extends Repository<Account, AccountTypeOrm>
  implements AccountRepository
{
  constructor(
    @InjectRepository(AccountTypeOrm)
    protected readonly accountRepository: TypeOrmRepository<AccountTypeOrm>,
    eventBus: EventBus,
  ) {
    super(accountRepository, eventBus, AccountMapper);
  }

  private createQueryBuilder(): SelectQueryBuilder<AccountTypeOrm> {
    return this.accountRepository.createQueryBuilder('account');
  }

  async findById(id: string): Promise<Account | null> {
    const entity = await this.createQueryBuilder()
      .where('account.id = :id', { id })
      .getOne();

    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Account[]> {
    const accounts = await this.createQueryBuilder()
      .orderBy('account.name', 'ASC')
      .getMany();

    return accounts.map((account) => AccountMapper.toDomain(account));
  }
}
