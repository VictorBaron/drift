import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { SLACK_GATEWAY } from './domain/slack.gateway';
import { SlackInstallationRepository } from './domain/slack-installation.repository';
import { BoltSlackGateway } from './infrastructure/gateways/bolt-slack.gateway';
import { INSTALLATION_STORE } from './infrastructure/persistence/installation-store.token';
import { SlackInstallationMikroOrm } from './infrastructure/persistence/mikro-orm/models/slack-installation.mikroORM';
import { SlackInstallationRepositoryMikroOrm } from './infrastructure/persistence/mikro-orm/slack-installation.repository.mikroORM';
import { SlackInstallationStore } from './infrastructure/persistence/slack-installation.store';

@Module({
  imports: [MikroOrmModule.forFeature([SlackInstallationMikroOrm])],
  providers: [
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
  ],
  exports: [],
})
export class SlackModule {}
