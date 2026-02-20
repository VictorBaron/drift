import { ForbiddenException } from '@nestjs/common';
import { AggregateRoot } from 'common/domain';
import {
  MemberActivatedEvent,
  MemberDisabledEvent,
  MemberEnabledEvent,
  MemberInvitedEvent,
  MemberRoleChangedEvent,
} from '@/accounts/domain/events';
import { MemberPreferences, MemberRole } from '@/accounts/domain/value-objects';
import { User } from '@/users/domain';
import type { CreateFounderMemberProps, CreateMemberProps, MemberJSON, MemberProps } from './member.types';

export class Member extends AggregateRoot {
  private accountId: string;
  private user: User;
  private role: MemberRole;
  private invitedAt: Date | null;
  private activatedAt: Date | null;
  private disabledAt: Date | null;
  private invitedById: string | null;
  private lastActiveAt: Date | null;
  private preferences: MemberPreferences;

  private constructor(props: MemberProps) {
    super(props);
    this.accountId = props.accountId;
    this.user = props.user;
    this.role = props.role;
    this.invitedAt = props.invitedAt;
    this.activatedAt = props.activatedAt;
    this.disabledAt = props.disabledAt;
    this.invitedById = props.invitedById;
    this.lastActiveAt = props.lastActiveAt;
    this.preferences = props.preferences;
  }

  static invite({ inviter, user }: CreateMemberProps): Member {
    const now = new Date();

    if (!inviter.canInvite()) {
      throw new ForbiddenException('Only active admins can invite new members');
    }

    const member = new Member({
      id: crypto.randomUUID(),
      accountId: inviter.accountId,
      user,
      role: MemberRole.user,
      invitedAt: now,
      activatedAt: null,
      disabledAt: null,
      invitedById: inviter.id,
      lastActiveAt: null,
      preferences: MemberPreferences.empty(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    member.addDomainEvent(
      new MemberInvitedEvent({
        invitedMember: member,
        accountId: member.accountId,
        actor: inviter,
      }),
    );

    return member;
  }

  static createFounder(props: CreateFounderMemberProps): Member {
    const now = new Date();

    const member = new Member({
      id: crypto.randomUUID(),
      accountId: props.accountId,
      user: props.user,
      role: MemberRole.admin,
      invitedAt: null,
      activatedAt: now,
      disabledAt: null,
      invitedById: null,
      lastActiveAt: now,
      preferences: MemberPreferences.empty(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    return member;
  }

  static reconstitute(props: MemberProps): Member {
    return new Member(props);
  }

  inviteAgain(actor: Member): void {
    if (this.isActive()) {
      return;
    }
    if (!actor.canInvite()) {
      throw new ForbiddenException('Only active admins can invite new members');
    }
    if (actor.accountId !== this.accountId) {
      throw new ForbiddenException('Trying to invite a member from another account');
    }

    const now = new Date();
    this.invitedById = actor.id;
    this.invitedAt = now;
    this.updatedAt = now;
    this.disabledAt = null;
    this.activatedAt = null;

    this.addDomainEvent(
      new MemberInvitedEvent({
        actor: this,
        accountId: this.accountId,
        invitedMember: this,
      }),
    );
  }

  activate(): void {
    if (this.isActive()) return;
    if (!this.isPending()) {
      throw new ForbiddenException('Invitation has already been accepted');
    }

    this.activatedAt = new Date();
    this.updatedAt = new Date();
    this.addDomainEvent(
      new MemberActivatedEvent({
        actor: this,
        accountId: this.accountId,
      }),
    );
  }

  disable(disabledBy: Member): void {
    if (this.disabledAt) return;

    if (disabledBy.id === this.id) {
      throw new ForbiddenException('Members cannot disable themselves');
    }
    if (!disabledBy.canDisable()) {
      this.updatedAt = new Date();
      this.addDomainEvent(
        new MemberDisabledEvent({
          member: this,
          accountId: this.accountId,
          actor: disabledBy,
        }),
      );
    }
  }

  enable({ activatedBy }: { activatedBy: Member }): void {
    if (!this.disabledAt) {
      throw new ForbiddenException('Member is not disabled');
    }
    if (activatedBy.id === this.id) {
      throw new ForbiddenException('Members cannot enable themselves');
    }
    if (!activatedBy.canEnable()) {
      throw new ForbiddenException('Only admin members can enable members');
    }
    this.disabledAt = null;
    this.updatedAt = new Date();
    this.addDomainEvent(
      new MemberEnabledEvent({
        member: this,
        accountId: this.accountId,
        actor: activatedBy,
      }),
    );
  }

  canDisable(): boolean {
    return this.isAdmin() && this.isActive();
  }

  canEnable(): boolean {
    return this.isAdmin() && this.isActive();
  }

  canChangeRole(): boolean {
    return this.isAdmin() && this.isActive();
  }

  canInvite(): boolean {
    return this.isAdmin() && this.isActive();
  }

  changeRole({ role, actor }: { role: MemberRole; actor: Member }): void {
    if (this.role.equals(role)) {
      return;
    }
    if (actor.id === this.id) {
      throw new ForbiddenException('Members cannot change their own role');
    }
    if (!actor.canChangeRole()) {
      throw new ForbiddenException('Only admin members can change member roles');
    }
    const previousRole = this.role;
    this.role = role;
    this.updatedAt = new Date();
    this.addDomainEvent(
      new MemberRoleChangedEvent({
        member: this,
        accountId: this.accountId,
        previousRole: previousRole.getValue(),
        newRole: role.getValue(),
        actor,
      }),
    );
  }

  updateLastActiveAt(): void {
    this.lastActiveAt = new Date();
    this.updatedAt = new Date();
  }

  isPending(): boolean {
    return this.activatedAt === null;
  }

  isActive(): boolean {
    return this.activatedAt !== null && this.disabledAt === null;
  }

  isDisabled(): boolean {
    return this.disabledAt !== null;
  }

  isAdmin(): boolean {
    return this.role.isAdmin();
  }

  getAccountId(): string {
    return this.accountId;
  }

  getUserId(): string {
    return this.user.getId();
  }

  getName(): string | null {
    return this.user.getName();
  }

  getEmail(): string {
    return this.user.getEmail();
  }

  identify({ accountId, slackUserId }: { accountId: string; slackUserId: string }) {
    return this.accountId === accountId && this.user.getSlackId() === slackUserId;
  }

  toJSON(): MemberJSON {
    return {
      id: this.id,
      accountId: this.accountId,
      userId: this.user.getId(),
      role: this.role.getValue(),
      invitedAt: this.invitedAt,
      activatedAt: this.activatedAt,
      disabledAt: this.disabledAt,
      invitedById: this.invitedById,
      lastActiveAt: this.lastActiveAt,
      preferences: this.preferences.getValue(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
