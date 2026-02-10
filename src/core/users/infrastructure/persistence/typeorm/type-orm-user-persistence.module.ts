import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersistenceModule } from 'src/common/persistence-module';
import { UserRepository } from 'src/core/users/domain';

import { UserTypeOrm } from './models/user.typeorm';
import { UserRepositoryTypeOrm } from './user.repository.typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeOrm]), PersistenceModule],
  providers: [
    {
      provide: UserRepository,
      useClass: UserRepositoryTypeOrm,
    },
  ],
  exports: [UserRepository],
})
export class TypeOrmUserPersistenceModule {}
