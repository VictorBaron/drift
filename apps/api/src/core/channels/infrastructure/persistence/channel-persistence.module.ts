import { type DynamicModule, Module } from '@nestjs/common';

import { MikroOrmChannelPersistenceModule } from './mikro-orm/mikro-orm-channel-persistence.module';

@Module({})
export class ChannelPersistenceModule {
  static use(driver: 'orm'): DynamicModule {
    const persistenceModule = driver === 'orm' ? MikroOrmChannelPersistenceModule : null;

    if (!persistenceModule) {
      throw new Error(`Unsupported persistence driver: ${driver}`);
    }

    return {
      module: ChannelPersistenceModule,
      imports: [persistenceModule],
      exports: [persistenceModule],
    };
  }
}
