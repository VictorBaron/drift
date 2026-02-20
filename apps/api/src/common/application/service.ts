import { Logger } from '@nestjs/common';

export abstract class BaseService {
  protected readonly logger = new Logger(this.constructor.name);
}
