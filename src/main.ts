import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SlackService } from './slack/slack.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get Slack receiver's Express app for the /slack routes
  const slackService = app.get(SlackService);
  app.use('/slack', slackService.getExpressApp());

  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
  console.log('Install URL: http://localhost:3000/slack/install');
}
bootstrap();
