import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRepository } from 'src/core/users/domain';

export class LinkGoogleAccountCommand {
  constructor(
    readonly props: {
      userId: string;
      googleId: string;
      name?: string;
    },
  ) {}
}

@Injectable()
export class LinkGoogleAccountHandler {
  constructor(private readonly repository: UserRepository) {}

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
