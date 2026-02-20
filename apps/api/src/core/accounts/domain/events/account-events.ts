import { DomainEvent } from 'common/domain';

export class AccountCreatedEvent extends DomainEvent {
  readonly eventName = 'account.created';
  readonly accountId: string;
  readonly name: string;

  constructor({ accountId, name }: { accountId: string; name: string }) {
    super();
    this.accountId = accountId;
    this.name = name;
  }
}

export class AccountUpdatedEvent extends DomainEvent {
  readonly eventName = 'account.updated';

  constructor(readonly accountId: string) {
    super();
  }
}

export class AccountDeletedEvent extends DomainEvent {
  readonly eventName = 'account.deleted';

  constructor(readonly accountId: string) {
    super();
  }
}
