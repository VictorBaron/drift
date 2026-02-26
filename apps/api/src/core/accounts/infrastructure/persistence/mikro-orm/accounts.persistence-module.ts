import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'common/persistence-module';
import { MemberRepository } from '@/accounts/domain/repositories/member.repository';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { MemberRepositoryMikroOrm } from './member.repository.mikroORM';
import { MemberMikroOrm, OrganizationMikroOrm } from './models';
import { OrganizationRepositoryMikroOrm } from './organization.repository.mikroORM';

@Module({
  imports: [MikroOrmModule.forFeature([OrganizationMikroOrm, MemberMikroOrm]), PersistenceModule],
  providers: [
    {
      provide: OrganizationRepository,
      useClass: OrganizationRepositoryMikroOrm,
    },
    {
      provide: MemberRepository,
      useClass: MemberRepositoryMikroOrm,
    },
  ],
  exports: [OrganizationRepository, MemberRepository],
})
export class AccountsPersistenceModule {}
