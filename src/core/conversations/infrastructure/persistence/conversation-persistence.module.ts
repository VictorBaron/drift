import { type DynamicModule, Module } from '@nestjs/common';

import { MikroOrmConversationPersistenceModule } from './mikro-orm/mikro-orm-conversation-persistence.module';

@Module({})
export class ConversationPersistenceModule {
  static use(driver: 'orm'): DynamicModule {
    const persistenceModule =
      driver === 'orm' ? MikroOrmConversationPersistenceModule : null;

    if (!persistenceModule) {
      throw new Error(`Unsupported persistence driver: ${driver}`);
    }

    return {
      module: ConversationPersistenceModule,
      imports: [persistenceModule],
      exports: [persistenceModule],
    };
  }
}
