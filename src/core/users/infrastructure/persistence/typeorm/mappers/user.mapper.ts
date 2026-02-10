import { Email, User, UserJSON } from 'src/core/users/domain';
import { UserTypeOrm } from 'src/core/users/infrastructure/persistence/typeorm';

export class UserMapper {
  static toDomain(raw: UserTypeOrm): User {
    return User.reconstitute({
      id: raw.id,
      email: Email.reconstitute(raw.email),
      name: raw.name,
      password: raw.password,
      googleId: raw.googleId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(user: User): UserTypeOrm {
    const json = user.toJSON();
    return UserTypeOrm.build({
      id: json.id,
      email: json.email,
      name: json.name,
      password: json.password,
      googleId: json.googleId,
    });
  }

  static toResponse(user: User): UserJSON {
    return user.toJSON();
  }
}
