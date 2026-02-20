import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'common/persistence-module';
import { AccountRepository, MemberRepository } from '@/accounts/domain';

import { AccountRepositoryMikroOrm } from './account.repository.mikroORM';
import { MemberRepositoryMikroOrm } from './member.repository.mikroORM';
import { AccountMikroOrm, MemberMikroOrm } from './models';

@Module({
  imports: [MikroOrmModule.forFeature([AccountMikroOrm, MemberMikroOrm]), PersistenceModule],
  providers: [
    {
      provide: AccountRepository,
      useClass: AccountRepositoryMikroOrm,
    },
    {
      provide: MemberRepository,
      useClass: MemberRepositoryMikroOrm,
    },
  ],
  exports: [AccountRepository, MemberRepository],
})
export class MikroOrmAccountPersistenceModule {}
