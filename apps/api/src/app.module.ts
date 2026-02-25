import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MemberMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/member.mikroORM';
import { OrganizationMikroOrm } from '@/accounts/infrastructure/persistence/mikro-orm/models/organization.mikroORM';
import { AiModule } from '@/ai/ai.module';
import { LinearTicketSnapshotMikroOrm } from '@/integrations/linear/infrastructure/persistence/mikro-orm/models/linear-ticket-snapshot.mikroORM';
import { SlackMessageMikroOrm } from '@/integrations/slack/infrastructure/persistence/mikro-orm/models/slack-message.mikroORM';
import { ProjectMikroOrm } from '@/projects/infrastructure/persistence/mikro-orm/models/project.mikroORM';
import { ReportMikroOrm } from '@/reports/infrastructure/persistence/mikro-orm/models/report.mikroORM';
import { SlackInstallationMikroOrm } from '@/slack/infrastructure/persistence/mikro-orm/models/slack-installation.mikroORM';
import { SlackModule } from '@/slack/slack.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AccountsModule } from './core/accounts/accounts.module';
import { IntegrationsModule } from './core/integrations/integrations.module';
import { PipelineModule } from './core/pipeline/pipeline.module';
import { ProjectsModule } from './core/projects/projects.module';
import { ReportsModule } from './core/reports/reports.module';
import { SchedulerModule } from './core/scheduler/scheduler.module';
import { HealthModule } from './health/health.module';

const entities = [
  SlackInstallationMikroOrm,
  OrganizationMikroOrm,
  MemberMikroOrm,
  ProjectMikroOrm,
  SlackMessageMikroOrm,
  LinearTicketSnapshotMikroOrm,
  ReportMikroOrm,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    MikroOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        entities,
        driver: PostgreSqlDriver,
        clientUrl: config.get<string>('DATABASE_URL'),
        allowGlobalContext: config.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    AiModule,
    HealthModule,
    SlackModule,
    AuthModule,
    AccountsModule,
    ProjectsModule,
    IntegrationsModule,
    ReportsModule,
    PipelineModule,
    SchedulerModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
