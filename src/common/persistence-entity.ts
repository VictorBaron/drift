import { BaseEntity } from 'typeorm';

export abstract class PersistenceEntity extends BaseEntity {
  static build(props: OwnProperties<PersistenceEntity>): PersistenceEntity {
    return props as PersistenceEntity;
  }
}

type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >;
}[keyof T];

type RelationKeys<T extends PersistenceEntity> = {
  [K in keyof T]: NonNullable<T[K]> extends
    | PersistenceEntity
    | PersistenceEntity[]
    ? K
    : never;
}[keyof T];

export type OwnProperties<E extends BaseEntity> = Omit<
  E,
  RelationKeys<E> | keyof PersistenceEntity | ReadonlyKeys<E>
>;
