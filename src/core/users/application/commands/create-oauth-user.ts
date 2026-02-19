import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'src/common/application/command-handler';
import { User, UserRepository } from '@/users/domain';

export class CreateOAuthUserCommand {
  constructor(
    readonly props: {
      email: string;
      googleId: string;
      name?: string;
    },
  ) {}
}

@CommandHandler(CreateOAuthUserCommand)
export class CreateOAuthUser extends BaseCommand<CreateOAuthUserCommand> {
  constructor(private readonly repository: UserRepository) {
    super();
  }

  async execute(command: CreateOAuthUserCommand): Promise<User> {
    const user = User.createOAuthUser({
      email: command.props.email,
      googleId: command.props.googleId,
      name: command.props.name,
    });

    await this.repository.save(user);

    return user;
  }
}
