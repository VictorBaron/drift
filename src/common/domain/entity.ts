import { DomainModel, DomainModelProps } from './domain-model';

export interface EntityProps extends DomainModelProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletableEntityProps extends EntityProps {
  deletedAt: Date | null;
}

export interface EntityJSON {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletableEntityJSON extends EntityJSON {
  deletedAt: Date | null;
}

export abstract class Entity<T extends EntityProps> extends DomainModel<
  T,
  'id'
> {
  constructor(props: T) {
    super({ id: props.id });

    if (!props.createdAt) throw new Error('Missing creation date');

    if (!props.updatedAt) throw new Error('Missing update date');

    this.id = props.id;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public readonly id: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public equals(entity: Entity<T>): boolean {
    return this.id === entity.id;
  }
  public isEntity(): this is Entity<T> {
    return true;
  }

  public toJSON(): EntityJSON {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class SoftDeletableEntity<
  T extends SoftDeletableEntityProps,
> extends Entity<T> {
  constructor(props: T) {
    super(props);
    this.deletedAt = props.deletedAt;
  }

  public deletedAt: Date | null;

  public delete() {
    this.deletedAt = new Date();
  }

  public restore() {
    this.deletedAt = null;
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  public toJSON(): SoftDeletableEntityJSON {
    return {
      ...super.toJSON(),
      deletedAt: this.deletedAt ?? null,
    };
  }
}
