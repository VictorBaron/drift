import { Logger } from '@nestjs/common';
import type { ICommand } from '@nestjs/cqrs';

export abstract class BaseCommand<T extends ICommand> {
  protected readonly logger = new Logger(this.constructor.name);

  abstract execute(command: T): Promise<unknown>;
}
