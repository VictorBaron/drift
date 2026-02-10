import { AggregateRoot } from './aggregate-root';

export abstract class RepositoryPort<T extends AggregateRoot<any>> {
  abstract save(aggregate: T): Promise<void>;
}
