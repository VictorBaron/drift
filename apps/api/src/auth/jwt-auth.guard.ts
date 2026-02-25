import { type CanActivate, type ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies['session'] as string | undefined;

    if (!token) {
      this.logger.warn(`Missing session cookie — ${request.method} ${request.path} ip=${request.ip}`);
      throw new UnauthorizedException();
    }

    try {
      request.user = this.jwtService.verify(token);
      return true;
    } catch (err) {
      this.logger.warn(
        `JWT verification failed — ${request.method} ${request.path} ip=${request.ip} err=${(err as Error).message}`,
      );
      throw new UnauthorizedException();
    }
  }
}
