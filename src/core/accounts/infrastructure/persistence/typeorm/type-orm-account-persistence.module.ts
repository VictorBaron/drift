import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersistenceModule } from 'src/common/persistence-module';
import { AccountRepository, MemberRepository } from 'src/core/accounts/domain';

import { AccountRepositoryTypeOrm } from './account.repository.typeorm';
import { MemberRepositoryTypeOrm } from './member.repository.typeorm';
import { AccountTypeOrm } from './models/account.typeorm';
import { MemberTypeOrm } from './models/member.typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountTypeOrm, MemberTypeOrm]),
    PersistenceModule,
  ],
  providers: [
    {
      provide: AccountRepository,
      useClass: AccountRepositoryTypeOrm,
    },
    {
      provide: MemberRepository,
      useClass: MemberRepositoryTypeOrm,
    },
  ],
  exports: [AccountRepository, MemberRepository],
})
export class TypeOrmAccountPersistenceModule {}
