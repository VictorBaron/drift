import { rel } from '@mikro-orm/core';
import { Member, type MemberRole } from '@/accounts/domain/aggregates/member.aggregate';
import { MemberMikroOrm } from '../models/member.mikroORM';
import { OrganizationMikroOrm } from '../models/organization.mikroORM';

export class MemberMapper {
  static toDomain(raw: MemberMikroOrm): Member {
    return Member.reconstitute({
      id: raw.id,
      email: raw.email,
      name: raw.name,
      slackUserId: raw.slackUserId,
      avatarUrl: raw.avatarUrl,
      role: raw.role as MemberRole,
      organizationId: raw.organization.id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(member: Member): MemberMikroOrm {
    const json = member.toJSON();
    return MemberMikroOrm.build({
      id: json.id,
      email: json.email,
      name: json.name,
      slackUserId: json.slackUserId,
      avatarUrl: json.avatarUrl,
      role: json.role,
      organization: rel(OrganizationMikroOrm, json.organizationId),
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      deletedAt: json.deletedAt,
    });
  }
}
