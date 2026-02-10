import { AggregateRoot } from 'src/common/domain';
import {
  Email,
  GoogleAccountLinkedEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
} from 'src/core/users/domain';

import {
  CreateOAuthUserProps,
  CreateUserProps,
  UserJSON,
  UserProps,
} from './types';

export class User extends AggregateRoot {
  private email: Email;
  private name: string | null;
  private password: string | null;
  private googleId: string | null;

  private constructor(props: UserProps) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
    this.email = props.email;
    this.name = props.name;
    this.password = props.password;
    this.googleId = props.googleId;
  }

  static create(props: CreateUserProps): User {
    const email = Email.create(props.email);
    const now = new Date();

    const user = new User({
      id: crypto.randomUUID(),
      email,
      name: props.name ?? null,
      password: props.password ?? null,
      googleId: props.googleId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    user.addDomainEvent(
      new UserCreatedEvent({
        userId: user.id,
        email: email.getValue(),
      }),
    );

    return user;
  }

  static createOAuthUser(props: CreateOAuthUserProps): User {
    const email = Email.create(props.email);
    const now = new Date();

    const user = new User({
      id: crypto.randomUUID(),
      email,
      name: props.name ?? null,
      password: null,
      googleId: props.googleId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    user.addDomainEvent(
      new UserCreatedEvent({
        userId: user.id,
        email: email.getValue(),
      }),
    );

    return user;
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  updateName(name: string | null): void {
    this.name = name;
    this.updatedAt = new Date();
    this.addDomainEvent(new UserUpdatedEvent(this.id));
  }

  linkGoogleAccount(googleId: string, name?: string): void {
    if (this.googleId) {
      throw new Error('Google account already linked');
    }
    this.googleId = googleId;
    if (name && !this.name) {
      this.name = name;
    }
    this.updatedAt = new Date();
    this.addDomainEvent(
      new GoogleAccountLinkedEvent({
        userId: this.id,
        googleId,
      }),
    );
  }

  hasGoogleAccount(): boolean {
    return this.googleId !== null;
  }

  getId(): string {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getName(): string | null {
    return this.name;
  }

  getPassword(): string | null {
    return this.password;
  }

  getGoogleId(): string | null {
    return this.googleId;
  }

  toJSON(): UserJSON {
    return {
      id: this.id,
      email: this.email.getValue(),
      name: this.name,
      password: this.password,
      googleId: this.googleId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  toLightJSON(): { id: string; email: string; name: string | null } {
    return {
      id: this.id,
      email: this.email.getValue(),
      name: this.name,
    };
  }
}
