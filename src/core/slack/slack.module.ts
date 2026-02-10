import { Module } from '@nestjs/common';

import { SLACK_GATEWAY } from './domain/slack.gateway';
import { BoltSlackGateway } from './infrastructure/gateways/bolt-slack.gateway';

@Module({
  providers: [
    {
      provide: SLACK_GATEWAY,
      useClass: BoltSlackGateway,
    },
  ],
  exports: [SLACK_GATEWAY],
})
export class SlackModule {}
