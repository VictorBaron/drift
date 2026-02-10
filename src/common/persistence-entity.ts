import { PrimaryKey } from '@mikro-orm/core';

export abstract class PersistenceEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;
}
