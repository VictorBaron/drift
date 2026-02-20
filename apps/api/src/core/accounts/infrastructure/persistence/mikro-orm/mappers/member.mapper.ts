import { rel } from '@mikro-orm/core';
import { Member, MemberPreferences, MemberRole } from '@/accounts/domain';
import { UserMapper } from '@/users/infrastructure/persistence/mikro-orm/mappers/user.mapper';
import { UserMikroOrm } from '@/users/infrastructure/persistence/mikro-orm/models/user.mikroORM';
import { AccountMikroOrm } from '../models/account.mikroORM';
import { MemberMikroOrm } from '../models/member.mikroORM';

export class MemberMapper {
  static toDomain(raw: MemberMikroOrm): Member {
    if (!raw.account) throw new Error('Error reconstructing Member: missing account');
    if (!raw.user) throw new Error('Error reconstructing Member: missing user');
    return Member.reconstitute({
      id: raw.id,
      accountId: raw.account?.id,
      user: UserMapper.toDomain(raw.user),
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
    const entity = MemberMikroOrm.build({
      id: json.id,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      deletedAt: json.deletedAt,
      account: rel(AccountMikroOrm, json.accountId),
      user: rel(UserMikroOrm, json.userId),
      invitedAt: json.invitedAt,
      activatedAt: json.activatedAt,
      role: json.role,
      disabledAt: json.disabledAt,
      invitedById: json.invitedById,
      lastActiveAt: json.lastActiveAt,
      preferences: json.preferences,
    });

    return entity;
  }
}
