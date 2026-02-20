export interface IDomainEvent {
  occurredAt: Date;
}

export abstract class DomainEvent implements IDomainEvent {
  constructor() {
    this.occurredAt = new Date();
  }

  public occurredAt: Date;
}
