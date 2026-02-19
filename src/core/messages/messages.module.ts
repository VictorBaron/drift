import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AccountPersistenceModule } from '@/accounts/infrastructure';
import { ChannelsModule } from '@/channels';
import { ConversationsModule } from '@/conversations';
import { ScoringModule } from '@/scoring/scoring.module';
import { FilterIncomingMessage } from './application/commands/filter-incoming-message';
import { FilterIncomingReaction } from './application/commands/filter-incoming-reaction';
import { MessagePersistenceModule } from './infrastructure/persistence/message-persistence.module';

@Module({
  imports: [
    CqrsModule,
    MessagePersistenceModule.use('orm'),
    AccountPersistenceModule.use('orm'),
    ScoringModule,
    ChannelsModule,
    ConversationsModule,
  ],
  providers: [FilterIncomingMessage, FilterIncomingReaction],
})
export class MessagesModule {}
