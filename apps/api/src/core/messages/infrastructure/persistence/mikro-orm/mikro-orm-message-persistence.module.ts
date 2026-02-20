import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'common/persistence-module';

import { MessageRepository } from '@/messages/domain';

import { MessageRepositoryMikroOrm } from './message.repository.mikroORM';
import { MessageMikroOrm } from './models';

@Module({
  imports: [MikroOrmModule.forFeature([MessageMikroOrm]), PersistenceModule],
  providers: [
    {
      provide: MessageRepository,
      useClass: MessageRepositoryMikroOrm,
    },
  ],
  exports: [MessageRepository],
})
export class MikroOrmMessagePersistenceModule {}
