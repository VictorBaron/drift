import { DomainEvent } from 'common/domain';
import type { Member, MemberRoleLevel } from '@/accounts/domain';

export class MemberInvitedEvent extends DomainEvent {
  readonly eventName = 'member.invited';
  readonly actor: Member;
  readonly accountId: string;
  readonly invitedMember: Member;

  constructor({
    actor,
    accountId,
    invitedMember,
  }: {
    actor: Member;
    accountId: string;
    invitedMember: Member;
  }) {
    super();
    this.actor = actor;
    this.accountId = accountId;
    this.invitedMember = invitedMember;
  }
}

export class MemberActivatedEvent extends DomainEvent {
  readonly eventName = 'member.activated';
  readonly actor: Member;
  readonly accountId: string;

  constructor({ actor, accountId }: { actor: Member; accountId: string }) {
    super();
    this.actor = actor;
    this.accountId = accountId;
  }
}

export class MemberDisabledEvent extends DomainEvent {
  readonly eventName = 'member.disabled';
  readonly member: Member;
  readonly actor: Member;
  readonly accountId: string;

  constructor({
    member,
    actor,
    accountId,
  }: {
    member: Member;
    actor: Member;
    accountId: string;
  }) {
    super();
    this.member = member;
    this.actor = actor;
    this.accountId = accountId;
  }
}

export class MemberEnabledEvent extends DomainEvent {
  readonly eventName = 'member.enabled';
  readonly member: Member;
  readonly actor: Member;
  readonly accountId: string;

  constructor({
    member,
    actor,
    accountId,
  }: {
    member: Member;
    actor: Member;
    accountId: string;
  }) {
    super();
    this.member = member;
    this.actor = actor;
    this.accountId = accountId;
  }
}

export class MemberRoleChangedEvent extends DomainEvent {
  readonly eventName = 'member.role_changed';
  readonly member: Member;
  readonly actor: Member;
  readonly accountId: string;
  readonly previousRole: MemberRoleLevel;
  readonly newRole: MemberRoleLevel;

  constructor({
    member,
    accountId,
    actor,
    previousRole,
    newRole,
  }: {
    member: Member;
    accountId: string;
    actor: Member;
    previousRole: MemberRoleLevel;
    newRole: MemberRoleLevel;
  }) {
    super();
    this.member = member;
    this.accountId = accountId;
    this.actor = actor;
    this.previousRole = previousRole;
    this.newRole = newRole;
  }
}
