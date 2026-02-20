import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { TransactionManagerService } from './transaction-manager.service';

@Module({
  imports: [CqrsModule],
  providers: [TransactionManagerService],
  exports: [TransactionManagerService, CqrsModule],
})
export class PersistenceModule {}
