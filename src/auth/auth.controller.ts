import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import type { UserJSON } from '@/users/domain';

import { AuthService } from './auth.service';
import { CookieAuthGuard } from './cookie-auth.guard';
import type { LoginDto } from './dto';
import { GoogleAuthGuard } from './google-auth.guard';

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions() {
    const nodeEnv = (this.config.get('NODE_ENV') as string) ?? 'development';
    const isProd = nodeEnv === 'production';

    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: isProd,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(dto.email, dto.password);
    res.cookie('session', token, this.cookieOptions());
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('session', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(CookieAuthGuard)
  me(@Req() req: Request) {
    const payload = (req as Request & { user: { sub: string; email: string; name?: string } }).user;
    return { id: payload.sub, email: payload.email, name: payload.name };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const userJson = req.user as UserJSON;
    const token = await this.auth.generateTokenFromJson(userJson);

    res.cookie('session', token, this.cookieOptions());

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    res.redirect(frontendUrl);
  }
}
