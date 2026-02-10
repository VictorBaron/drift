import { PersistenceEntity } from 'src/common/persistence-entity';

import { AggregateRoot } from './aggregate-root';

export interface Mapper<
  T extends AggregateRoot<any>,
  X extends PersistenceEntity,
> {
  toPersistence(aggregate: T): X;
  toDomain(entity: X): T;
}
