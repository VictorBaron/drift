import { AggregateRoot } from 'common/domain';

import { AccountCreatedEvent, AccountUpdatedEvent } from '@/accounts/domain/events';

import type { AccountJSON, AccountProps, CreateAccountProps } from './account.types';

export class Account extends AggregateRoot {
  private name: string;
  private slackTeamId: string;

  private constructor(props: AccountProps) {
    super({
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    });
    this.name = props.name;
    this.slackTeamId = props.slackTeamId;
  }

  static create(props: CreateAccountProps): Account {
    const now = new Date();

    const account = new Account({
      id: crypto.randomUUID(),
      name: props.name,
      slackTeamId: props.slackTeamId,
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

  getName(): string {
    return this.name;
  }

  get isActive(): boolean {
    return true;
  }

  toJSON(): AccountJSON {
    return {
      id: this.id,
      name: this.name,
      slackTeamId: this.slackTeamId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
