import { Injectable } from '@nestjs/common';
import { User, UserRepository } from 'src/core/users/domain';

export class CreateOAuthUserCommand {
  constructor(
    readonly props: {
      email: string;
      googleId: string;
      name?: string;
    },
  ) {}
}

@Injectable()
export class CreateOAuthUserHandler {
  constructor(private readonly repository: UserRepository) {}

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
