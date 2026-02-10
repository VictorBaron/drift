import {
  Member,
  MemberPreferences,
  MemberRole,
} from 'src/core/accounts/domain';
import { MemberTypeOrm } from 'src/core/accounts/infrastructure/persistence/typeorm';
export class MemberMapper {
  static toDomain(raw: MemberTypeOrm): Member {
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

  static toPersistence(member: Member): MemberTypeOrm {
    const json = member.toJSON();
    return MemberTypeOrm.build({
      id: json.id,
      accountId: json.accountId,
      userId: json.userId,
      role: json.role,
      invitedAt: json.invitedAt,
      activatedAt: json.activatedAt,
      disabledAt: json.disabledAt,
      invitedById: json.invitedById,
      lastActiveAt: json.lastActiveAt,
      preferences: json.preferences,
    });
  }
}
