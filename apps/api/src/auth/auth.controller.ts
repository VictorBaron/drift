import { Controller, Get, Logger, Query, Redirect, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser, type JwtPayload } from './current-user.decorator';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('slack')
  @Redirect()
  @Public()
  redirectToSlack() {
    const apiUrl = this.config.getOrThrow<string>('API_URL');
    return { url: `${apiUrl}/slack/install`, statusCode: 302 };
  }

  @Get('slack/signin')
  @Public()
  redirectToSlackSignIn(@Res() res: Response) {
    const state = crypto.randomUUID();
    const clientId = this.config.getOrThrow<string>('SLACK_CLIENT_ID');
    const apiUrl = this.config.getOrThrow<string>('API_URL');
    const redirectUri = encodeURIComponent(`${apiUrl}/auth/slack/signin/callback`);

    res.cookie('slack_signin_state', state, { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' });
    res.redirect(
      `https://slack.com/openid/connect/authorize?response_type=code&client_id=${clientId}&scope=openid+profile+email&redirect_uri=${redirectUri}&state=${state}`,
    );
  }

  @Get('slack/signin/callback')
  @Public()
  async handleSlackSignInCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const webUrl = this.config.getOrThrow<string>('WEB_URL');

    try {
      const cookieState = req.cookies['slack_signin_state'];
      if (!cookieState || cookieState !== state) {
        res.redirect(`${webUrl}/error?code=invalid_state`);
        return;
      }

      const { memberId, orgId } = await this.authService.slackSignIn(code);

      const token = this.jwtService.sign({ sub: memberId, orgId });
      const isProduction = this.config.get('NODE_ENV') === 'production';
      const cookieFlags = `HttpOnly; Path=/; SameSite=Lax${isProduction ? '; Secure' : ''}`;

      res.clearCookie('slack_signin_state');
      res.setHeader('Set-Cookie', `session=${token}; ${cookieFlags}`);
      res.redirect(`${webUrl}/dashboard?token=${token}`);
    } catch (error) {
      this.logger.error('Slack sign-in callback failed', error);
      res.redirect(`${webUrl}/error?code=signin_failed`);
    }
  }

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }
}
