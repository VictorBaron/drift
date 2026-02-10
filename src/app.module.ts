import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { SlackModule } from './slack/slack.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    MikroOrmModule.forRoot({
      entities: ['./dist/**/*.mikroORM.js'],
      entitiesTs: ['./src/**/*.mikroORM.ts'],
      dbName: 'my-db-name.sqlite3',
      driver: PostgreSqlDriver,
    }),
    SlackModule,
  ],
})
export class AppModule {}
