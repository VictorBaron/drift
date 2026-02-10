import { DynamicModule, Module } from '@nestjs/common';

import { InMemoryUserPersistenceModule } from './inmemory/in-memory-user-persistence.module';
import { TypeOrmUserPersistenceModule } from './typeorm/type-orm-user-persistence.module';

@Module({})
export class UserPersistenceModule {
  static use(driver: 'orm' | 'in-memory'): DynamicModule {
    const persistenceModule =
      driver === 'orm'
        ? TypeOrmUserPersistenceModule
        : InMemoryUserPersistenceModule;

    return {
      module: UserPersistenceModule,
      imports: [persistenceModule],
      exports: [persistenceModule],
    };
  }
}
