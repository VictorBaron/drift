import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ReportsPersistenceModule } from './infrastructure/persistence/reports.persistence-module';

@Module({
  imports: [CqrsModule, ReportsPersistenceModule],
  providers: [],
  exports: [],
})
export class ReportsModule {}
