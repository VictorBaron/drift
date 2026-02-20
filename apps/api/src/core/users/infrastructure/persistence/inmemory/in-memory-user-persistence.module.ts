import { Module } from '@nestjs/common';

import { UserRepository } from '@/users/domain';

import { UserRepositoryInMemory } from './user.repository.in-memory';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: UserRepositoryInMemory,
    },
  ],
  exports: [UserRepository],
})
export class InMemoryUserPersistenceModule {}
