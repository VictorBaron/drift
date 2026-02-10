import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { SLACK_GATEWAY, SlackGateway } from './core/slack/domain/slack.gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const slackGateway = app.get<SlackGateway>(SLACK_GATEWAY);
  app.use('/slack', slackGateway.getExpressApp());

  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
  console.log('Install URL: http://localhost:3000/slack/install');
}
bootstrap();
