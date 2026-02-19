import type { IDomainEvent } from './domain-event';
import { SoftDeletableEntity, type SoftDeletableEntityJSON, type SoftDeletableEntityProps } from './entity';

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

  public getId(): string {
    return this.id;
  }

  public findEvents<EventType extends IDomainEvent>(
    // biome-ignore lint/suspicious/noExplicitAny: Args could be anything
    eventType: new (...args: any[]) => EventType,
  ): Array<EventType> {
    return this.domainEvents.filter((e) => e.constructor.name === eventType.name).map((event) => event as EventType);
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
