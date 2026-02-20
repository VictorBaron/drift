export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    if (!value || !value.includes('@')) {
      throw new Error('Invalid email format');
    }
    return new Email(value.toLowerCase().trim());
  }

  static reconstitute(value: string): Email {
    return new Email(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
