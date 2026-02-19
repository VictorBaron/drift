import { CommandHandler } from '@nestjs/cqrs';
import type { ReactionAddedEvent } from '@slack/types';
import { BaseCommand } from 'src/common/application/command-handler';

export class FilterIncomingReactionCommand {
  constructor(
    readonly props: {
      reactionEvent: ReactionAddedEvent;
    },
  ) {}
}

@CommandHandler(FilterIncomingReactionCommand)
export class FilterIncomingReaction extends BaseCommand<FilterIncomingReactionCommand> {
  async execute(command: FilterIncomingReactionCommand): Promise<void> {
    const { reactionEvent } = command.props;

    this.logger.log('Reaction received:', reactionEvent);
  }
}
