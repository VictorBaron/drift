import { IDomainEvent } from './domain-event';
import {
  SoftDeletableEntity,
  SoftDeletableEntityJSON,
  SoftDeletableEntityProps,
} from './entity';

type EventPublisher = { publish: (event: IDomainEvent) => void };

export type AggregateRootProps = SoftDeletableEntityProps;
export type AggregateRootJSON = SoftDeletableEntityJSON;

export abstract class AggregateRoot<
  T extends SoftDeletableEntityProps = SoftDeletableEntityProps,
> extends SoftDeletableEntity<T> {
  private domainEvents: IDomainEvent[] = [];

  protected addDomainEvent(...events: IDomainEvent[]): void {
    this.domainEvents.push(...events);
  }

  public findEvents<T extends object>(
    eventType: new (...args: any[]) => T,
  ): Array<T> {
    return this.domainEvents
      .filter((e) => e.constructor.name === eventType.name)
      .map((event) => event as T);
  }

  public publishEvents(publisher: EventPublisher): void {
    this.domainEvents.forEach((event) => {
      publisher.publish(event);
    });
    this.clearEvents();
  }

  private clearEvents(): void {
    this.domainEvents = [];
  }
}
