import { Injectable, NotFoundException } from '@nestjs/common';

import { User, UserRepository } from '@/users/domain';

export class GetUserByIdQuery {
  constructor(readonly userId: string) {}
}

@Injectable()
export class GetUserById {
  constructor(private readonly repository: UserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<User> {
    const user = await this.repository.findById(query.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
