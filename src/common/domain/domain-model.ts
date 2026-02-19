import type { Entity, EntityProps } from './entity';

export type DomainModelProps = object;

export type DomainModelIdentifier<T extends DomainModelProps, K extends keyof T> = Pick<T, K>;

export abstract class DomainModel<T extends DomainModelProps, K extends keyof T> {
  constructor(public readonly identifier: DomainModelIdentifier<T, K>) {
    Object.values(this.identifier).forEach((value) => {
      if (value === undefined || value === null) {
        throw new Error(this.constructor.name + ' identifier properties cannot be null or undefined');
      }
    });
  }

  public equals(domainModel: DomainModel<T, K>): boolean {
    return this.hasSameIdentifier(domainModel.identifier);
  }
  public hasSameIdentifier(identifier: DomainModelIdentifier<T, K>): boolean {
    return Object.entries(this.identifier).every(([key, value]) => key in identifier && identifier[key as K] === value);
  }
  public isEntity(): this is Entity<T & EntityProps> {
    return false;
  }
}
