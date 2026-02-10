import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'src/common/persistence-module';
import { AccountRepository, MemberRepository } from 'src/core/accounts/domain';

import { AccountRepositoryMikroOrm } from './account.repository.mikro-orm';
import { MemberRepositoryMikroOrm } from './member.repository.mikro-orm';
import { AccountMikroOrm, MemberMikroOrm } from './models';

@Module({
  imports: [
    MikroOrmModule.forFeature([AccountMikroOrm, MemberMikroOrm]),
    PersistenceModule,
  ],
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
