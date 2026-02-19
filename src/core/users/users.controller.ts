import { Controller, Get, UseGuards } from '@nestjs/common';
import { CookieAuthGuard } from 'auth/cookie-auth.guard';

import { GetAllUsers } from './application/queries';

@Controller('v1/users')
@UseGuards(CookieAuthGuard)
export class UsersController {
  constructor(private readonly getAllUsers: GetAllUsers) {}

  @Get()
  async findAll() {
    const users = await this.getAllUsers.execute();
    return users.map((user) => user.toLightJSON());
  }
}
