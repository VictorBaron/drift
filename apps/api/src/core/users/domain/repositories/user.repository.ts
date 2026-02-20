import { RepositoryPort } from 'common/domain/repository-port';

import type { User } from '@/users/domain';

export abstract class UserRepository extends RepositoryPort<User> {
  abstract findById(id: string): Promise<User | null>;
  abstract findByIds(ids: string[]): Promise<User[]>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByGoogleId(googleId: string): Promise<User | null>;
  abstract findBySlackId(slackId: string): Promise<User | null>;
  abstract findAll(): Promise<User[]>;
  abstract save(user: User): Promise<void>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
