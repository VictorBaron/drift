import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRepository } from 'src/core/users/domain';

export class GetUserByIdQuery {
  constructor(readonly userId: string) {}
}

@Injectable()
export class GetUserByIdHandler {
  constructor(private readonly repository: UserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<User> {
    const user = await this.repository.findById(query.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
