import { DynamicModule, Module } from '@nestjs/common';

import { TypeOrmAccountPersistenceModule } from './typeorm/type-orm-account-persistence.module';

@Module({})
export class AccountPersistenceModule {
  static use(driver: 'orm'): DynamicModule {
    const persistenceModule =
      driver === 'orm' ? TypeOrmAccountPersistenceModule : null;

    if (!persistenceModule) {
      throw new Error(`Unsupported persistence driver: ${driver}`);
    }

    return {
      module: AccountPersistenceModule,
      imports: [persistenceModule],
      exports: [persistenceModule],
    };
  }
}
