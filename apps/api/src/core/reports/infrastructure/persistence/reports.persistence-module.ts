import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'common/persistence-module';
import { ReportRepository } from '@/reports/domain/repositories/report.repository';
import { ReportMikroOrm } from './mikro-orm/models/report.mikroORM';
import { ReportRepositoryMikroOrm } from './mikro-orm/report.repository.mikroORM';

@Module({
  imports: [MikroOrmModule.forFeature([ReportMikroOrm]), PersistenceModule],
  providers: [
    {
      provide: ReportRepository,
      useClass: ReportRepositoryMikroOrm,
    },
  ],
  exports: [ReportRepository],
})
export class ReportsPersistenceModule {}
