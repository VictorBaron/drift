import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'common/persistence-module';
import { ChannelRepository } from '@/channels/domain';

import { ChannelRepositoryMikroOrm } from './channel.repository.mikroORM';
import { ChannelMikroOrm } from './models/channel.mikroORM';

@Module({
  imports: [MikroOrmModule.forFeature([ChannelMikroOrm]), PersistenceModule],
  providers: [
    {
      provide: ChannelRepository,
      useClass: ChannelRepositoryMikroOrm,
    },
  ],
  exports: [ChannelRepository],
})
export class MikroOrmChannelPersistenceModule {}
