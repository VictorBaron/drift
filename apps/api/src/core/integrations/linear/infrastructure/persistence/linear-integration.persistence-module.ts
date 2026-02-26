import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'common/persistence-module';
import { LinearTicketSnapshotRepository } from '@/integrations/linear/domain/repositories/linear-ticket-snapshot.repository';
import { LinearTicketSnapshotRepositoryMikroOrm } from './mikro-orm/linear-ticket-snapshot.repository.mikroORM';
import { LinearTicketSnapshotMikroOrm } from './mikro-orm/models/linear-ticket-snapshot.mikroORM';

@Module({
  imports: [MikroOrmModule.forFeature([LinearTicketSnapshotMikroOrm]), PersistenceModule],
  providers: [
    {
      provide: LinearTicketSnapshotRepository,
      useClass: LinearTicketSnapshotRepositoryMikroOrm,
    },
  ],
  exports: [LinearTicketSnapshotRepository],
})
export class LinearIntegrationPersistenceModule {}
