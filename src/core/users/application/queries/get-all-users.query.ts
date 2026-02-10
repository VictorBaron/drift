import { Injectable } from '@nestjs/common';
import { User, UserRepository } from 'src/core/users/domain';

export class GetAllUsersQuery {}

@Injectable()
export class GetAllUsersHandler {
  constructor(private readonly repository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.repository.findAll();
  }
}
