import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { CreateUserCommand } from '@/users/application/commands';
import { GetUserByEmail, GetUserByEmailQuery } from '@/users/application/queries';
import type { User, UserJSON } from '@/users/domain';

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly getUserByEmail: GetUserByEmail,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const hash = await argon2.hash(password);
    const user = await this.commandBus.execute(new CreateUserCommand({ email, password: hash }));
    return { id: user.getId(), email: user.getEmail() };
  }

  async login(email: string, password: string) {
    const user = await this.getUserByEmail.execute(new GetUserByEmailQuery(email));
    if (!user || !user.getPassword()) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await argon2.verify(user.getPassword()!, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = await this.generateToken(user);
    return {
      token,
      user: {
        id: user.getId(),
        email: user.getEmail(),
        name: user.getName(),
      },
    };
  }

  async generateToken(user: User) {
    return this.jwt.signAsync({
      sub: user.getId(),
      email: user.getEmail(),
      name: user.getName(),
    });
  }

  async generateTokenFromJson(user: UserJSON) {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
  }

  async verifyToken(token: string) {
    return this.jwt.verifyAsync<object>(token);
  }
}
