import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { AccountsModule } from '@/accounts/accounts.module';
import { AccountMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/account.mikroORM';
import { MemberMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/member.mikroORM';
import { AiModule } from '@/ai/ai.module';
import { ChannelMikroOrm } from '@/channels/infrastructure/persistence/mikro-orm/models/channel.mikroORM';
import { MessageMikroOrm } from '@/messages/infrastructure/persistence/mikro-orm/models/message.mikroORM';
import { MessagesModule } from '@/messages/messages.module';
import { SlackInstallationMikroOrm } from '@/slack/infrastructure/persistence/mikro-orm/models/slack-installation.mikroORM';
import { SlackModule } from '@/slack/slack.module';
import { UserMikroOrm } from '@/users/infrastructure/persistence/mikro-orm/models/user.mikroORM';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    MikroOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        entities: [
          UserMikroOrm,
          AccountMikroOrm,
          MemberMikroOrm,
          ChannelMikroOrm,
          MessageMikroOrm,
          SlackInstallationMikroOrm,
        ],
        driver: PostgreSqlDriver,
        clientUrl: config.get<string>('DATABASE_URL'),
        allowGlobalContext: true,
      }),
      inject: [ConfigService],
    }),
    AccountsModule,
    UsersModule,
    SlackModule,
    MessagesModule,
    AiModule,
  ],
})
export class AppModule {}
