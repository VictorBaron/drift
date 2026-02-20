import { Email, User, type UserProps } from '@/users/domain';

export class UserFactory {
  static create(overrides?: Partial<UserProps>): User {
    return User.reconstitute({
      id: 'userId',
      name: 'John Doe',
      password: 'pwd',
      googleId: 'googleId',
      slackId: 'slackId',
      email: Email.create('user@email.com'),
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      deletedAt: null,
      ...overrides,
    });
  }
}
