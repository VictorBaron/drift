import { type DynamicModule, Module } from '@nestjs/common';

import { MikroOrmMessagePersistenceModule } from './mikro-orm/mikro-orm-message-persistence.module';

@Module({})
export class MessagePersistenceModule {
  static use(driver: 'orm'): DynamicModule {
    const persistenceModule = driver === 'orm' ? MikroOrmMessagePersistenceModule : null;

    if (!persistenceModule) {
      throw new Error(`Unsupported persistence driver: ${driver}`);
    }

    return {
      module: MessagePersistenceModule,
      imports: [persistenceModule],
      exports: [persistenceModule],
    };
  }
}
