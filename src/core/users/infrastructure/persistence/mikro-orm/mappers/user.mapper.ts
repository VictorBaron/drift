import { Email, User, UserJSON } from 'src/core/users/domain';
import { UserMikroOrm } from 'src/core/users/infrastructure/persistence/mikro-orm';

export class UserMapper {
  static toDomain(raw: UserMikroOrm): User {
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

  static toPersistence(user: User): UserMikroOrm {
    const json = user.toJSON();
    const entity = new UserMikroOrm();
    entity.id = json.id;
    entity.email = json.email;
    entity.name = json.name;
    entity.password = json.password;
    entity.googleId = json.googleId;
    entity.createdAt = json.createdAt;
    entity.updatedAt = json.updatedAt;
    entity.deletedAt = json.deletedAt;
    return entity;
  }

  static toResponse(user: User): UserJSON {
    return user.toJSON();
  }
}
