import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from 'auth/auth.module';
import { AccountsPersistenceModule } from '@/accounts/infrastructure/persistence/mikro-orm/accounts.persistence-module';
import { DeliverPortfolioSummaryHandler } from '@/integrations/slack/application/commands/deliver-portfolio-summary/deliver-portfolio-summary.handler';
import { DeliverReportHandler } from '@/integrations/slack/application/commands/deliver-report/deliver-report.handler';
import { ProjectsPersistenceModule } from '@/projects/infrastructure/persistence/projects.persistence-module';
import { ReportsPersistenceModule } from '@/reports/infrastructure/persistence/reports.persistence-module';
import { SLACK_GATEWAY } from './domain/gateways/slack.gateway';
import { SLACK_API_GATEWAY } from './domain/gateways/slack-api.gateway';
import { slackIntegrationServices } from './domain/services';
import { BoltSlackGateway } from './infrastructure/gateways/bolt-slack.gateway';
import { WebApiSlackGateway } from './infrastructure/gateways/web-api-slack.gateway';
import { INSTALLATION_STORE } from './infrastructure/persistence/installation-store.token';
import { SlackInstallationStore } from './infrastructure/persistence/slack-installation.store';
import { SlackIntegrationPersistenceModule } from './infrastructure/persistence/slack-integration.persistence-module';

@Module({
  imports: [
    CqrsModule,
    AuthModule,
    ProjectsPersistenceModule,
    SlackIntegrationPersistenceModule,
    AccountsPersistenceModule,
    ReportsPersistenceModule,
  ],
  providers: [
    ...slackIntegrationServices,
    DeliverReportHandler,
    DeliverPortfolioSummaryHandler,
    {
      provide: SLACK_GATEWAY,
      useClass: BoltSlackGateway,
    },
    {
      provide: INSTALLATION_STORE,
      useClass: SlackInstallationStore,
    },
    {
      provide: SLACK_API_GATEWAY,
      useClass: WebApiSlackGateway,
    },
  ],
  exports: [DeliverReportHandler, DeliverPortfolioSummaryHandler, SlackIntegrationPersistenceModule],
})
export class SlackIntegrationModule {}
