import { RepositoryInMemory } from 'common/domain/repository.in-memory';

import { User, UserRepository } from '@/users/domain';

export class UserRepositoryInMemory extends RepositoryInMemory<User> implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    return this.find((user) => user.getEmail() === normalizedEmail) ?? null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.find((user) => user.getGoogleId() === googleId) ?? null;
  }

  async findBySlackId(slackId: string): Promise<User | null> {
    return this.find((user) => user.getSlackId() === slackId) ?? null;
  }
}
