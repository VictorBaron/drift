import { Injectable } from '@nestjs/common';
import { User, UserRepository } from 'src/core/users/domain';

export class CreateUserCommand {
  constructor(
    readonly props: {
      email: string;
      password: string;
    },
  ) {}
}

@Injectable()
export class CreateUserHandler {
  constructor(private readonly repository: UserRepository) {}

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
