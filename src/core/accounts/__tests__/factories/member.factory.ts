import { Member, MemberPreferences, type MemberProps, MemberRole } from '@/accounts/domain';
import { UserFactory } from '@/users/__tests__/factories/user.factory';

export class MemberFactory {
  static create(overrides?: Partial<MemberProps>): Member {
    return Member.reconstitute({
      id: 'memberId',
      accountId: 'accountId',
      user: UserFactory.create({ id: 'userId' }),
      role: MemberRole.user,
      invitedAt: null,
      activatedAt: new Date('2026-01-02'),
      disabledAt: null,
      invitedById: null,
      lastActiveAt: new Date('2026-01-03'),
      preferences: MemberPreferences.empty(),
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-03'),
      deletedAt: null,
      ...overrides,
    });
  }

  static createAdmin(overrides?: Partial<MemberProps>): Member {
    return MemberFactory.create({
      ...overrides,
      role: MemberRole.admin,
      activatedAt: overrides?.activatedAt ?? new Date(),
    });
  }

  static createPending(overrides?: Partial<MemberProps>): Member {
    return MemberFactory.create({
      invitedAt: new Date('2026-01-01'),
      invitedById: 'inviterId',
      ...overrides,
      activatedAt: null,
      lastActiveAt: null,
    });
  }
}
