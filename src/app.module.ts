import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { AccountMikroOrm } from './core/accounts/infrastructure/persistence/mikro-orm/models/account.mikroORM';
import { MemberMikroOrm } from './core/accounts/infrastructure/persistence/mikro-orm/models/member.mikroORM';
import { UserMikroOrm } from './core/users/infrastructure/persistence/mikro-orm/models/user.mikroORM';
import { SlackModule } from './slack/slack.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    MikroOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        entities: [UserMikroOrm, AccountMikroOrm, MemberMikroOrm],
        driver: PostgreSqlDriver,
        clientUrl: config.get<string>('DATABASE_URL'),
        allowGlobalContext: true,
      }),
      inject: [ConfigService],
    }),
    SlackModule,
  ],
})
export class AppModule {}
