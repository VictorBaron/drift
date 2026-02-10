import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'src/common/domain';
import { User, UserRepository } from 'src/core/users/domain';
import { Repository as TypeOrmRepository, SelectQueryBuilder } from 'typeorm';

import { UserMapper } from './mappers';
import { UserTypeOrm } from './models/user.typeorm';

@Injectable()
export class UserRepositoryTypeOrm
  extends Repository<User, UserTypeOrm>
  implements UserRepository
{
  constructor(
    @InjectRepository(UserTypeOrm)
    protected readonly userRepository: TypeOrmRepository<UserTypeOrm>,
    eventBus: EventBus,
  ) {
    super(userRepository, eventBus, UserMapper);
  }

  private createQueryBuilder(): SelectQueryBuilder<UserTypeOrm> {
    return this.userRepository.createQueryBuilder('user');
  }

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.createQueryBuilder()
      .where('user.id = :id', { id })
      .getOne();

    return userEntity ? UserMapper.toDomain(userEntity) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const userEntities = await this.createQueryBuilder()
      .where('user.id IN (:...ids)', { ids })
      .getMany();

    return userEntities.map((user) => UserMapper.toDomain(user));
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.createQueryBuilder()
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();

    return userEntity ? UserMapper.toDomain(userEntity) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const userEntity = await this.createQueryBuilder()
      .where('user.googleId = :googleId', { googleId })
      .getOne();

    return userEntity ? UserMapper.toDomain(userEntity) : null;
  }

  async findAll(): Promise<User[]> {
    const userEntities = await this.createQueryBuilder()
      .orderBy('user.name', 'ASC')
      .getMany();

    return userEntities.map((user) => UserMapper.toDomain(user));
  }
}
