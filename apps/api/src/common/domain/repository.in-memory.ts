import type { AggregateRoot } from './aggregate-root';
import type { SoftDeletableEntityProps } from './entity';

export class RepositoryInMemory<Aggregate extends AggregateRoot<SoftDeletableEntityProps>> {
  constructor(protected readonly aggregates: Map<string, Aggregate> = new Map()) {}

  get(id: string): Aggregate | undefined {
    return this.aggregates.get(id);
  }

  toArray(): Aggregate[] {
    return Array.from(this.aggregates.values());
  }

  find(predicate: (v: Aggregate, i: number, obj: Aggregate[]) => boolean): Promise<Aggregate | null> {
    return Promise.resolve(this.toArray().find(predicate) ?? null);
  }
  filter(predicate: (v: Aggregate, i: number, obj: Aggregate[]) => boolean): Promise<Aggregate[]> {
    return Promise.resolve(this.toArray().filter(predicate));
  }

  async findById(id: string): Promise<Aggregate | null> {
    return Promise.resolve(this.get(id) ?? null);
  }

  async findByIds(ids: string[]): Promise<Aggregate[]> {
    return Promise.resolve(
      ids.map((id) => this.get(id)).filter((aggregate): aggregate is Aggregate => aggregate !== undefined),
    );
  }

  async findAll(): Promise<Aggregate[]> {
    return Promise.resolve(this.toArray());
  }

  async save(aggregate: Aggregate): Promise<void> {
    this.aggregates.set(aggregate.id, aggregate);
    return Promise.resolve();
  }

  async softDelete(aggregate: Aggregate): Promise<void> {
    return this.delete(aggregate);
  }

  async delete(aggregate: Aggregate): Promise<void> {
    this.aggregates.delete(aggregate.id);
    return Promise.resolve();
  }

  clear(): void {
    this.aggregates.clear();
  }

  initialize(aggregates: Aggregate[]): void {
    this.aggregates.clear();
    for (const aggregate of aggregates) {
      this.aggregates.set(aggregate.id, aggregate);
    }
  }
}
