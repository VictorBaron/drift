export type MemberPreferencesData = Record<string, unknown>;

export class MemberPreferences {
  constructor(private readonly data: MemberPreferencesData) {}

  static create(data: MemberPreferencesData = {}): MemberPreferences {
    return new MemberPreferences(data);
  }

  static empty(): MemberPreferences {
    return new MemberPreferences({});
  }

  getValue(): MemberPreferencesData {
    return { ...this.data };
  }

  equals(other: MemberPreferences): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data);
  }

  isEmpty(): boolean {
    return Object.keys(this.data).length === 0;
  }
}
