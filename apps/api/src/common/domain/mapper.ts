import type { PersistenceEntity } from 'common/persistence-entity';

import type { AggregateRoot } from './aggregate-root';
import type { SoftDeletableEntityProps } from './entity';

export interface Mapper<T extends AggregateRoot<SoftDeletableEntityProps>, X extends PersistenceEntity> {
  toPersistence(aggregate: T): X;
  toDomain(entity: X): T;
}
