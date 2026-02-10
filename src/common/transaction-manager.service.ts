import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionManagerService {
  constructor(private readonly em: EntityManager) {}

  async runInTransaction<T>(
    callback: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.em.transactional(callback);
  }
}
