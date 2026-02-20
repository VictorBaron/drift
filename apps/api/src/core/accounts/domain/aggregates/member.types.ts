import type { AggregateRootProps } from 'common/domain';
import type { MemberPreferences, MemberRole, MemberRoleLevel } from '@/accounts/domain/value-objects';
import { User } from '@/users/domain';
import type { Member } from './member.aggregate';

export interface MemberProps extends AggregateRootProps {
  accountId: string;
  user: User;
  role: MemberRole;
  invitedAt: Date | null;
  activatedAt: Date | null;
  disabledAt: Date | null;
  invitedById: string | null;
  lastActiveAt: Date | null;
  preferences: MemberPreferences;
}

export interface CreateMemberProps {
  user: User;
  inviter: Member;
}

export interface CreateFounderMemberProps {
  accountId: string;
  user: User;
}

export interface MemberJSON {
  id: string;
  accountId: string;
  userId: string;
  role: MemberRoleLevel;
  invitedAt: Date | null;
  activatedAt: Date | null;
  disabledAt: Date | null;
  invitedById: string | null;
  lastActiveAt: Date | null;
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
