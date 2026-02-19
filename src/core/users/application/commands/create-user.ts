import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommand } from 'src/common/application/command-handler';
import { User, UserRepository } from '@/users/domain';

export class CreateUserCommand {
  constructor(
    readonly props: {
      email: string;
      password: string;
    },
  ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUser extends BaseCommand<CreateUserCommand> {
  constructor(private readonly repository: UserRepository) {
    super();
  }

  async execute(command: CreateUserCommand): Promise<User> {
    const existingUser = await this.repository.findByEmail(command.props.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = User.create({
      email: command.props.email,
      password: command.props.password,
    });

    await this.repository.save(user);

    return user;
  }
}
