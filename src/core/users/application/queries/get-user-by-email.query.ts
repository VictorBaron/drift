import { Injectable } from '@nestjs/common';
import { User, UserRepository } from 'src/core/users/domain';

export class GetUserByEmailQuery {
  constructor(readonly email: string) {}
}

@Injectable()
export class GetUserByEmailHandler {
  constructor(private readonly repository: UserRepository) {}

  async execute(query: GetUserByEmailQuery): Promise<User | null> {
    return this.repository.findByEmail(query.email);
  }
}
