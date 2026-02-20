import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AccountPersistenceModule } from '@/accounts/infrastructure';
import { ChannelsModule } from '@/channels';
import { ConversationsModule } from '@/conversations';
import { URGENT_NOTIFICATION_GATEWAY } from '@/messages/domain';
import { ScoringModule } from '@/scoring/scoring.module';
import { FilterIncomingMessage } from './application/commands/filter-incoming-message';
import { FilterIncomingReaction } from './application/commands/filter-incoming-reaction';
import { NotificationsController } from './infrastructure/controllers/notifications.controller';
import { SseUrgentNotificationGateway } from './infrastructure/gateways/sse-urgent-notification.gateway';
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
  controllers: [NotificationsController],
  providers: [
    FilterIncomingMessage,
    FilterIncomingReaction,
    SseUrgentNotificationGateway,
    { provide: URGENT_NOTIFICATION_GATEWAY, useExisting: SseUrgentNotificationGateway },
  ],
})
export class MessagesModule {}
