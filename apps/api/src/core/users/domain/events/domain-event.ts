import { DomainEvent } from 'common/domain';

export class UserCreatedEvent extends DomainEvent {
  readonly eventName = 'user.created';
  readonly userId: string;
  readonly email: string;

  constructor({ userId, email }: { userId: string; email: string }) {
    super();
    this.userId = userId;
    this.email = email;
  }
}

export class UserUpdatedEvent extends DomainEvent {
  readonly eventName = 'user.updated';

  constructor(readonly userId: string) {
    super();
  }
}

export class GoogleAccountLinkedEvent extends DomainEvent {
  readonly eventName = 'user.google_account_linked';
  readonly userId: string;
  readonly googleId: string;

  constructor({ userId, googleId }: { userId: string; googleId: string }) {
    super();
    this.userId = userId;
    this.googleId = googleId;
  }
}
