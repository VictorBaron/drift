import {
  Member,
  MemberPreferences,
  MemberRole,
} from 'src/core/accounts/domain';
import { MemberMikroOrm } from 'src/core/accounts/infrastructure/persistence/mikro-orm';

export class MemberMapper {
  static toDomain(raw: MemberMikroOrm): Member {
    return Member.reconstitute({
      id: raw.id,
      accountId: raw.accountId,
      userId: raw.userId,
      role: MemberRole.create(raw.role),
      invitedAt: raw.invitedAt,
      activatedAt: raw.activatedAt,
      disabledAt: raw.disabledAt,
      invitedById: raw.invitedById,
      lastActiveAt: raw.lastActiveAt,
      preferences: MemberPreferences.create(raw.preferences),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(member: Member): MemberMikroOrm {
    const json = member.toJSON();
    const entity = new MemberMikroOrm();
    entity.id = json.id;
    entity.accountId = json.accountId;
    entity.userId = json.userId;
    entity.role = json.role;
    entity.invitedAt = json.invitedAt;
    entity.activatedAt = json.activatedAt;
    entity.disabledAt = json.disabledAt;
    entity.invitedById = json.invitedById;
    entity.lastActiveAt = json.lastActiveAt;
    entity.preferences = json.preferences;
    entity.createdAt = json.createdAt;
    entity.updatedAt = json.updatedAt;
    entity.deletedAt = json.deletedAt;
    return entity;
  }
}
