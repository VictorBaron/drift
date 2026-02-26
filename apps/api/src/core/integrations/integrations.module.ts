import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AccountsPersistenceModule } from '@/accounts/infrastructure/persistence/mikro-orm/accounts.persistence-module';
import { LinearIntegrationPersistenceModule } from './linear/infrastructure/persistence/linear-integration.persistence-module';
import { SlackIntegrationModule } from './slack/slack-integration.module';

@Module({
  imports: [CqrsModule, SlackIntegrationModule, LinearIntegrationPersistenceModule, AccountsPersistenceModule],
  providers: [],
  exports: [],
})
export class IntegrationsModule {}
