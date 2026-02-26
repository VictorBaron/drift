import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AccountsPersistenceModule } from '@/accounts/infrastructure/persistence/mikro-orm/accounts.persistence-module';
import { ComputeDeliveryStatsHandler } from '@/integrations/linear/application/queries/compute-delivery-stats/compute-delivery-stats.query';
import { LinearIntegrationPersistenceModule } from '@/integrations/linear/infrastructure/persistence/linear-integration.persistence-module';
import { HasNotionPageChangedQuery } from '@/integrations/notion/application/queries/has-notion-page-changed/has-notion-page-changed.query';
import { ReadNotionPageQuery } from '@/integrations/notion/application/queries/read-notion-page/read-notion-page.query';
import { NOTION_API_GATEWAY } from '@/integrations/notion/domain/gateways/notion-api.gateway';
import { HttpNotionApiGateway } from '@/integrations/notion/infrastructure/gateways/http-notion-api.gateway';
import { SlackIntegrationPersistenceModule } from '@/integrations/slack/infrastructure/persistence/slack-integration.persistence-module';
import { ProjectsPersistenceModule } from '@/projects/infrastructure/persistence/projects.persistence-module';
import { ReportsPersistenceModule } from '@/reports/infrastructure/persistence/reports.persistence-module';
import { GenerateReportHandler } from './application/commands/generate-report/generate-report.handler';
import { LLM_GATEWAY } from './domain/gateways/llm.gateway';
import { PromptBuilderService } from './domain/services/prompt-builder.service';
import { ReportParserService } from './domain/services/report-parser.service';
import { ReportsController } from './infrastructure/controllers/reports.controller';
import { GenerationCronService } from './infrastructure/cron/generation.cron';
import { AnthropicLlmGateway } from './infrastructure/gateways/anthropic-llm.gateway';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AccountsPersistenceModule,
    ProjectsPersistenceModule,
    ReportsPersistenceModule,
    SlackIntegrationPersistenceModule,
    LinearIntegrationPersistenceModule,
  ],
  providers: [
    PromptBuilderService,
    ReportParserService,
    GenerateReportHandler,
    ComputeDeliveryStatsHandler,
    GenerationCronService,
    ReadNotionPageQuery,
    HasNotionPageChangedQuery,
    { provide: LLM_GATEWAY, useClass: AnthropicLlmGateway },
    { provide: NOTION_API_GATEWAY, useClass: HttpNotionApiGateway },
  ],
  controllers: [ReportsController],
  exports: [GenerateReportHandler],
})
export class PipelineModule {}
