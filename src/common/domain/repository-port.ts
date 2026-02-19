import type { AggregateRoot } from './aggregate-root';
import type { SoftDeletableEntityProps } from './entity';

export abstract class RepositoryPort<Agg extends AggregateRoot<SoftDeletableEntityProps>> {
  abstract save(aggregate: Agg): Promise<void>;
}
