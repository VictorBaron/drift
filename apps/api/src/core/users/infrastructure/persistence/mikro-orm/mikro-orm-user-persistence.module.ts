import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'common/persistence-module';

import { UserRepository } from '@/users/domain';

import { UserMikroOrm } from './models';
import { UserRepositoryMikroOrm } from './user.repository.mikroORM';

@Module({
  imports: [MikroOrmModule.forFeature([UserMikroOrm]), PersistenceModule],
  providers: [
    {
      provide: UserRepository,
      useClass: UserRepositoryMikroOrm,
    },
  ],
  exports: [UserRepository],
})
export class MikroOrmUserPersistenceModule {}
