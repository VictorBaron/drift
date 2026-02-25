import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TokenEncryption } from 'auth/token-encryption';
import { AccountsModule } from '@/accounts/accounts.module';
import { RegisterSlackInstallationHandler } from './application/commands/register-slack-installation/register-slack-installation.handler';
import { SLACK_GATEWAY } from './domain/slack.gateway';
import { SlackInstallationRepository } from './domain/slack-installation.repository';
import { BoltSlackGateway } from './infrastructure/gateways/bolt-slack.gateway';
import { INSTALLATION_STORE } from './infrastructure/persistence/installation-store.token';
import { SlackInstallationMikroOrm } from './infrastructure/persistence/mikro-orm/models/slack-installation.mikroORM';
import { SlackInstallationRepositoryMikroOrm } from './infrastructure/persistence/mikro-orm/slack-installation.repository.mikroORM';
import { SlackInstallationStore } from './infrastructure/persistence/slack-installation.store';

@Module({
  imports: [
    MikroOrmModule.forFeature([SlackInstallationMikroOrm]),
    AccountsModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    RegisterSlackInstallationHandler,
    {
      provide: SLACK_GATEWAY,
      useClass: BoltSlackGateway,
    },
    {
      provide: INSTALLATION_STORE,
      useClass: SlackInstallationStore,
    },
    {
      provide: SlackInstallationRepository,
      useClass: SlackInstallationRepositoryMikroOrm,
    },
    TokenEncryption,
  ],
  exports: [],
})
export class SlackModule {}
