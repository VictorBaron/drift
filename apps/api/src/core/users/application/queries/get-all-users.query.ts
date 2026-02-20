import { Injectable } from '@nestjs/common';

import { User, UserRepository } from '@/users/domain';

export class GetAllUsersQuery {}

@Injectable()
export class GetAllUsers {
  constructor(private readonly repository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.repository.findAll();
  }
}
