import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { AiModule } from '@/ai/ai.module';
import { SlackInstallationMikroOrm } from '@/slack/infrastructure/persistence/mikro-orm/models/slack-installation.mikroORM';
import { SlackModule } from '@/slack/slack.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    MikroOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        entities: [SlackInstallationMikroOrm],
        driver: PostgreSqlDriver,
        clientUrl: config.get<string>('DATABASE_URL'),
        allowGlobalContext: true,
      }),
      inject: [ConfigService],
    }),
    AiModule,
    SlackModule,
  ],
})
export class AppModule {}
