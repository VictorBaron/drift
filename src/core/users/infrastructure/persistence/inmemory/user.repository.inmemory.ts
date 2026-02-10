import { Injectable } from '@nestjs/common';
import { User, UserRepository } from 'src/core/users/domain';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const users = ids
      .map((id) => this.users.get(id))
      .filter((user): user is User => user !== undefined);
    return Promise.resolve(users);
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.getEmail().getValue() === normalizedEmail) {
        return user;
      }
    }
    return Promise.resolve(null);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.getGoogleId() === googleId) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }

  async findAll(): Promise<User[]> {
    const sorted = Array.from(this.users.values()).sort((a, b) => {
      const nameA = a.getName() ?? '';
      const nameB = b.getName() ?? '';
      return nameA.localeCompare(nameB);
    });
    return Promise.resolve(sorted);
  }

  async save(user: User): Promise<void> {
    this.users.set(user.getId(), user);
    return Promise.resolve();
  }

  clear(): void {
    this.users.clear();
  }
}
