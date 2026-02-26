import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AccountsPersistenceModule } from '@/accounts/infrastructure/persistence/mikro-orm/accounts.persistence-module';
import { LinearIntegrationModule } from './linear/linear-integration.module';
import { NotionIntegrationModule } from './notion/notion-integration.module';
import { SlackIntegrationModule } from './slack/slack-integration.module';

@Module({
  imports: [
    CqrsModule,
    SlackIntegrationModule,
    LinearIntegrationModule,
    NotionIntegrationModule,
    AccountsPersistenceModule,
  ],
  providers: [],
  exports: [],
})
export class IntegrationsModule {}
