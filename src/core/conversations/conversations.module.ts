import { Module } from '@nestjs/common';

import { SLACK_CONVERSATIONS_GATEWAY } from './domain/gateways/slack-conversations.gateway';
import { WebApiSlackConversationsGateway } from './infrastructure/gateways/web-api-slack-conversations.gateway';
import { ConversationPersistenceModule } from './infrastructure/persistence/conversation-persistence.module';

@Module({
  imports: [ConversationPersistenceModule.use('orm')],
  providers: [
    {
      provide: SLACK_CONVERSATIONS_GATEWAY,
      useClass: WebApiSlackConversationsGateway,
    },
  ],
  exports: [
    ConversationPersistenceModule.use('orm'),
    SLACK_CONVERSATIONS_GATEWAY,
  ],
})
export class ConversationsModule {}
