import { AggregateRoot } from 'src/common/domain';
import {
  AccountCreatedEvent,
  AccountUpdatedEvent,
} from 'src/core/accounts/domain/events';

import { AccountJSON, AccountProps, CreateAccountProps } from './account.types';

export class Account extends AggregateRoot {
  private name: string;

  private constructor(props: AccountProps) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
    this.name = props.name;
  }

  static create(props: CreateAccountProps): Account {
    const now = new Date();

    const account = new Account({
      id: crypto.randomUUID(),
      name: props.name,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    account.addDomainEvent(
      new AccountCreatedEvent({
        accountId: account.id,
        name: account.name,
      }),
    );

    return account;
  }

  static reconstitute(props: AccountProps): Account {
    return new Account(props);
  }

  updateName(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
    this.addDomainEvent(new AccountUpdatedEvent(this.id));
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  toJSON(): AccountJSON {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
