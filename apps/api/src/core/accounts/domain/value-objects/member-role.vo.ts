export enum MemberRoleLevel {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export type MemberRoleLevelStr = 'ADMIN' | 'USER';

export class MemberRole {
  constructor(private readonly value: MemberRoleLevel) {
    if (!Object.values(MemberRoleLevel).includes(value)) {
      throw new Error(`Invalid member role: ${value}`);
    }
  }

  static create(value: MemberRoleLevel): MemberRole {
    return new MemberRole(value);
  }

  static get admin(): MemberRole {
    return new MemberRole(MemberRoleLevel.ADMIN);
  }

  static get user(): MemberRole {
    return new MemberRole(MemberRoleLevel.USER);
  }

  getValue(): MemberRoleLevel {
    return this.value;
  }

  equals(other: MemberRole): boolean {
    return this.value === other.value;
  }

  isAdmin(): boolean {
    return this.value === MemberRoleLevel.ADMIN;
  }
}
