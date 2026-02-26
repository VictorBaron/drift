import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AccountsPersistenceModule } from './infrastructure/persistence/mikro-orm/accounts.persistence-module';

@Module({
  imports: [CqrsModule, AccountsPersistenceModule],
  providers: [],
  exports: [],
})
export class AccountsModule {}
