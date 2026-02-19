import { NotFoundException } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'src/common/application/command-handler';
import { User, UserRepository } from '@/users/domain';

export class LinkGoogleAccountCommand {
  constructor(
    readonly props: {
      userId: string;
      googleId: string;
      name?: string;
    },
  ) {}
}

@CommandHandler(LinkGoogleAccountCommand)
export class LinkGoogleAccount extends BaseCommand<LinkGoogleAccountCommand> {
  constructor(private readonly repository: UserRepository) {
    super();
  }

  async execute(command: LinkGoogleAccountCommand): Promise<User> {
    const user = await this.repository.findById(command.props.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.linkGoogleAccount(command.props.googleId, command.props.name);

    await this.repository.save(user);

    return user;
  }
}
