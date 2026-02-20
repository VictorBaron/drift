import { Module } from '@nestjs/common';

import { SLACK_CHANNELS_GATEWAY } from './domain/gateways/slack-channels.gateway';
import { WebApiSlackChannelsGateway } from './infrastructure/gateways/web-api-slack-channels.gateway';
import { ChannelPersistenceModule } from './infrastructure/persistence/channel-persistence.module';

@Module({
  imports: [ChannelPersistenceModule.use('orm')],
  providers: [
    {
      provide: SLACK_CHANNELS_GATEWAY,
      useClass: WebApiSlackChannelsGateway,
    },
  ],
  exports: [ChannelPersistenceModule.use('orm'), SLACK_CHANNELS_GATEWAY],
})
export class ChannelsModule {}
