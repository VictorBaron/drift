import { Injectable } from '@nestjs/common';

import { User, UserRepository } from '@/users/domain';

export class GetUserByGoogleIdQuery {
  constructor(readonly googleId: string) {}
}

@Injectable()
export class GetUserByGoogleId {
  constructor(private readonly repository: UserRepository) {}

  async execute(query: GetUserByGoogleIdQuery): Promise<User | null> {
    return this.repository.findByGoogleId(query.googleId);
  }
}
