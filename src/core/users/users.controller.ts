import { Controller, Get, UseGuards } from '@nestjs/common';
import { CookieAuthGuard } from 'src/auth/cookie-auth.guard';

import { GetAllUsersHandler } from './application/queries';

@Controller('v1/users')
@UseGuards(CookieAuthGuard)
export class UsersController {
  constructor(private readonly getAllUsersHandler: GetAllUsersHandler) {}

  @Get()
  async findAll() {
    const users = await this.getAllUsersHandler.execute();
    return users.map((user) => user.toLightJSON());
  }
}
