import { type DynamicModule, Module } from '@nestjs/common';

import { MikroOrmAccountPersistenceModule } from './mikro-orm/mikro-orm-account-persistence.module';

@Module({})
export class AccountPersistenceModule {
  static use(driver: 'orm'): DynamicModule {
    const persistenceModule = driver === 'orm' ? MikroOrmAccountPersistenceModule : null;

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
