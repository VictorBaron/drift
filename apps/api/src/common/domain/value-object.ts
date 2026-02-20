/**
 * @desc ValueObjects are objects that we determine their
 * equality through their structural property.
 * They should be immutable: if you want to change the value,
 * you should create a new instance of the value object.
 */

export abstract class ValueObject<T extends object> {
  constructor(protected readonly props: T) {}

  public equals(valueObject?: ValueObject<T>): boolean {
    if (valueObject === null || valueObject === undefined) return false;

    return Object.entries(this.props).every(
      ([key, value]) => key in valueObject.props && valueObject.props[key as keyof T] === value,
    );
  }
}
