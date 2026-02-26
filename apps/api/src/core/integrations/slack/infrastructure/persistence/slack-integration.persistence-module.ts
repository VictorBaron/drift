import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'common/persistence-module';
import { SlackMessageRepository } from '@/integrations/slack/domain/repositories/slack-message.repository';
import { SlackInstallationMikroOrm } from '@/integrations/slack/infrastructure/persistence/mikro-orm/models/slack-installation.mikroORM';
import { SlackInstallationRepositoryMikroOrm } from '@/integrations/slack/infrastructure/persistence/mikro-orm/slack-installation.repository.mikroORM';
import { SlackInstallationRepository } from '../../domain/repositories/slack-installation.repository';
import { SlackMessageMikroOrm } from './mikro-orm/models/slack-message.mikroORM';
import { SlackMessageRepositoryMikroOrm } from './mikro-orm/slack-message.repository.mikroORM';

@Module({
  imports: [MikroOrmModule.forFeature([SlackMessageMikroOrm, SlackInstallationMikroOrm]), PersistenceModule],
  providers: [
    {
      provide: SlackMessageRepository,
      useClass: SlackMessageRepositoryMikroOrm,
    },
    {
      provide: SlackInstallationRepository,
      useClass: SlackInstallationRepositoryMikroOrm,
    },
  ],
  exports: [SlackMessageRepository, SlackInstallationRepository],
})
export class SlackIntegrationPersistenceModule {}
