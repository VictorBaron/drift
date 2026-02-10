export interface IDomainEvent {
  occurredAt: Date;
}

export type DomainEventProps = Record<string, any>;

export abstract class DomainEvent implements IDomainEvent {
  constructor() {
    this.occurredAt = new Date();
  }

  public occurredAt: Date;
}
