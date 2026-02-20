import { Email, User, type UserJSON } from '@/users/domain';
import { UserMikroOrm } from '../models/user.mikroORM';

export class UserMapper {
  static toDomain(raw: UserMikroOrm): User {
    return User.reconstitute({
      id: raw.id,
      email: Email.reconstitute(raw.email),
      name: raw.name,
      password: raw.password,
      googleId: raw.googleId,
      slackId: raw.slackId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(user: User): UserMikroOrm {
    const json = user.toJSON();
    const entity = UserMikroOrm.build({
      ...json,
    });

    return entity;
  }

  static toResponse(user: User): UserJSON {
    return user.toJSON();
  }
}
