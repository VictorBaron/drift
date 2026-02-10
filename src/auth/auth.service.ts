import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import {
  CreateUserCommand,
  CreateUserHandler,
} from 'src/core/users/application/commands';
import {
  GetUserByEmailHandler,
  GetUserByEmailQuery,
} from 'src/core/users/application/queries';
import { User, UserJSON } from 'src/core/users/domain';

@Injectable()
export class AuthService {
  constructor(
    private readonly createUserHandler: CreateUserHandler,
    private readonly getUserByEmailHandler: GetUserByEmailHandler,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const hash = await argon2.hash(password);
    const user = await this.createUserHandler.execute(
      new CreateUserCommand({ email, password: hash }),
    );
    return { id: user.getId(), email: user.getEmail().getValue() };
  }

  async login(email: string, password: string) {
    const user = await this.getUserByEmailHandler.execute(
      new GetUserByEmailQuery(email),
    );
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
        email: user.getEmail().getValue(),
        name: user.getName(),
      },
    };
  }

  async generateToken(user: User) {
    return this.jwt.signAsync({
      sub: user.getId(),
      email: user.getEmail().getValue(),
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
