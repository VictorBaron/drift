import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'common/persistence-module';

import { ConversationRepository } from '@/conversations/domain';

import { ConversationRepositoryMikroOrm } from './conversation.repository.mikroORM';
import { ConversationMikroOrm } from './models/conversation.mikroORM';

@Module({
  imports: [
    MikroOrmModule.forFeature([ConversationMikroOrm]),
    PersistenceModule,
  ],
  providers: [
    {
      provide: ConversationRepository,
      useClass: ConversationRepositoryMikroOrm,
    },
  ],
  exports: [ConversationRepository],
})
export class MikroOrmConversationPersistenceModule {}
