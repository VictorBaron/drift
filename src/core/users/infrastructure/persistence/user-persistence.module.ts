import { type DynamicModule, Module } from '@nestjs/common';

import { InMemoryUserPersistenceModule } from './inmemory/in-memory-user-persistence.module';
import { MikroOrmUserPersistenceModule } from './mikro-orm/mikro-orm-user-persistence.module';

@Module({})
export class UserPersistenceModule {
  static use(driver: 'orm' | 'in-memory'): DynamicModule {
    const persistenceModule = driver === 'orm' ? MikroOrmUserPersistenceModule : InMemoryUserPersistenceModule;

    return {
      module: UserPersistenceModule,
      imports: [persistenceModule],
      exports: [persistenceModule],
    };
  }
}
