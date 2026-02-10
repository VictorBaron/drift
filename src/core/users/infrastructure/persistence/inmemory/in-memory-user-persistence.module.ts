import { Module } from '@nestjs/common';
import { UserRepository } from 'src/core/users/domain';

import { InMemoryUserRepository } from './user.repository.inmemory';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: InMemoryUserRepository,
    },
  ],
  exports: [UserRepository],
})
export class InMemoryUserPersistenceModule {}
