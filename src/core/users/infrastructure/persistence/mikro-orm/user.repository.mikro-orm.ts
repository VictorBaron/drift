import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Repository } from 'src/common/domain';
import { User, UserRepository } from 'src/core/users/domain';

import { UserMapper } from './mappers';
import { UserMikroOrm } from './models';

@Injectable()
export class UserRepositoryMikroOrm
  extends Repository<User, UserMikroOrm>
  implements UserRepository
{
  constructor(em: EntityManager, eventBus: EventBus) {
    super(em, eventBus, UserMapper, UserMikroOrm);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.em.findOne(UserMikroOrm, { id });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const entities = await this.em.find(UserMikroOrm, { id: { $in: ids } });
    return entities.map((e) => UserMapper.toDomain(e));
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.em.findOne(UserMikroOrm, {
      email: email.toLowerCase(),
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const entity = await this.em.findOne(UserMikroOrm, { googleId });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<User[]> {
    const entities = await this.em.find(
      UserMikroOrm,
      {},
      { orderBy: { name: 'ASC' } },
    );
    return entities.map((e) => UserMapper.toDomain(e));
  }
}
