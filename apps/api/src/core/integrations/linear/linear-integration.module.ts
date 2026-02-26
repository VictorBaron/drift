import { Module } from '@nestjs/common';
import { AuthModule } from 'auth/auth.module';

import { AccountsPersistenceModule } from '@/accounts/infrastructure/persistence/mikro-orm/accounts.persistence-module';
import { ProjectsPersistenceModule } from '@/projects/infrastructure/persistence/projects.persistence-module';
import { ComputeDeliveryStatsHandler } from './application/queries/compute-delivery-stats/compute-delivery-stats.query';
import { LINEAR_API_GATEWAY } from './domain/gateways/linear-api.gateway';
import { SnapshotLinearProjectService } from './domain/services/snapshot-linear-project/snapshot-linear-project.service';
import { SnapshotOrganizationLinearService } from './domain/services/snapshot-organization-linear/snapshot-organization-linear.service';
import { LinearAuthController } from './infrastructure/controllers/linear-auth.controller';
import { LinearIngestionCron } from './infrastructure/cron/linear-ingestion.cron';
import { HttpLinearApiGateway } from './infrastructure/gateways/http-linear-api.gateway';
import { LinearIntegrationPersistenceModule } from './infrastructure/persistence/linear-integration.persistence-module';

@Module({
  imports: [AuthModule, AccountsPersistenceModule, ProjectsPersistenceModule, LinearIntegrationPersistenceModule],
  providers: [
    SnapshotLinearProjectService,
    SnapshotOrganizationLinearService,
    ComputeDeliveryStatsHandler,
    LinearIngestionCron,
    { provide: LINEAR_API_GATEWAY, useClass: HttpLinearApiGateway },
  ],
  controllers: [LinearAuthController],
  exports: [SnapshotLinearProjectService, SnapshotOrganizationLinearService, ComputeDeliveryStatsHandler],
})
export class LinearIntegrationModule {}
