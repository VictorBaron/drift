import {
  EntityManager,
  type EntityName,
  type FilterQuery,
  type FindOneOptions,
  type FindOptions,
  type Populate,
  type Primary,
} from '@mikro-orm/postgresql';
import { EventBus } from '@nestjs/cqrs';
import type { PersistenceEntity } from 'common/persistence-entity';

import type { AggregateRoot } from './aggregate-root';
import type { SoftDeletableEntityProps } from './entity';
import type { Mapper } from './mapper';

export class RepositoryMikroORM<
  Aggregate extends AggregateRoot<SoftDeletableEntityProps>,
  StorageModel extends PersistenceEntity,
  PopulateHint extends string = never,
> {
  protected readonly defaultPopulate: Populate<StorageModel, PopulateHint> = [];

  constructor(
    protected readonly em: EntityManager,
    protected readonly eventBus: EventBus,
    protected readonly mapper: Mapper<Aggregate, StorageModel>,
    protected readonly entityName: EntityName<StorageModel>,
  ) {}

  protected findOne(
    where: FilterQuery<StorageModel>,
    options?: Omit<FindOneOptions<StorageModel, PopulateHint>, 'populate'>,
  ) {
    const opts = {
      ...options,
      populate: this.defaultPopulate,
    } as FindOneOptions<StorageModel, PopulateHint>;
    return this.em.findOne(this.entityName, where, opts);
  }

  protected find(
    where: FilterQuery<StorageModel>,
    options?: Omit<FindOptions<StorageModel, PopulateHint>, 'populate'>,
  ) {
    const opts = {
      ...options,
      populate: this.defaultPopulate,
    } as FindOptions<StorageModel, PopulateHint>;
    return this.em.find(this.entityName, where, opts);
  }

  getRef(id: Primary<StorageModel>) {
    return this.em.getReference(this.entityName, id);
  }

  mapArrayToDomain(storageEntities: StorageModel[]): Aggregate[] {
    return storageEntities.map((se) => this.mapper.toDomain(se));
  }
  mapToDomain(storageEntity: StorageModel | null): Aggregate | null {
    if (!storageEntity) return null;
    return this.mapper.toDomain(storageEntity);
  }

  async save(aggregate: Aggregate): Promise<void> {
    const entity = this.mapper.toPersistence(aggregate);
    await this.em.upsert(this.entityName, entity);
    await this.em.flush();
    aggregate.publishEvents(this.eventBus);
  }

  async saveMany(aggregates: Aggregate[]): Promise<Aggregate[]> {
    const entities = aggregates.map((aggregate) => this.mapper.toPersistence(aggregate));
    await this.em.upsertMany(this.entityName, entities);
    await this.em.flush();

    aggregates.forEach((aggregate) => aggregate.publishEvents(this.eventBus));
    return aggregates;
  }

  async delete(aggregate: Aggregate): Promise<void> {
    const entity = this.mapper.toPersistence(aggregate);
    const ref = this.getRef(entity.id as Primary<StorageModel>);

    await this.em.remove(ref).flush();
    aggregate.publishEvents(this.eventBus);
  }

  async softDelete(aggregate: Aggregate): Promise<void> {
    aggregate.delete();
    return this.save(aggregate);
  }
}
