import { EventBus } from '@nestjs/cqrs';
import { PersistenceEntity } from 'src/common/persistence-entity';
import { Repository as TypeOrmRepository } from 'typeorm';

import { AggregateRoot } from './aggregate-root';
import { Mapper } from './mapper';

export class Repository<
  Aggregate extends AggregateRoot<any>,
  StorageModel extends PersistenceEntity,
> {
  constructor(
    protected readonly repository: TypeOrmRepository<StorageModel>,
    protected readonly eventBus: EventBus,
    protected readonly mapper: Mapper<Aggregate, StorageModel>,
  ) {}

  async save(aggregate: Aggregate): Promise<void> {
    const entity = this.mapper.toPersistence(aggregate);

    await this.repository.save(entity);

    aggregate.publishEvents(this.eventBus);
  }

  async saveMany(aggregates: Aggregate[]): Promise<Aggregate[]> {
    const entities = aggregates.map((aggregate) =>
      this.mapper.toPersistence(aggregate),
    );

    await this.repository.save(entities);

    aggregates.forEach((aggregate) => aggregate.publishEvents(this.eventBus));

    return aggregates;
  }

  async delete(aggregate: Aggregate): Promise<void> {
    await this.repository.delete(aggregate.id);

    aggregate.publishEvents(this.eventBus);

    return;
  }

  async softDelete(aggregate: Aggregate): Promise<void> {
    await this.repository.softDelete(aggregate.id);

    aggregate.publishEvents(this.eventBus);

    return;
  }
}
