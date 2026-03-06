import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrentUser, type JwtPayload } from 'auth/current-user.decorator';
import { Public } from 'auth/public.decorator';

import { ConnectLinearHandler } from '@/integrations/linear/application/commands/connect-linear/connect-linear.handler';
import { GetLinearTeamsHandler } from '@/integrations/linear/application/queries/get-linear-teams/get-linear-teams.handler';

@Controller('integrations/linear')
export class LinearAuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly connectLinear: ConnectLinearHandler,
    private readonly getLinearTeams: GetLinearTeamsHandler,
  ) {}

  @Get('teams')
  listTeams(@CurrentUser() user: JwtPayload) {
    return this.getLinearTeams.execute({ orgId: user.orgId });
  }

  @Get('connect')
  @Redirect()
  connect(@CurrentUser() user: JwtPayload) {
    const state = Buffer.from(user.orgId).toString('base64url');
    const clientId = this.config.getOrThrow('LINEAR_CLIENT_ID');
    const redirectUri = this.buildCallbackUrl();
    const url = `https://linear.app/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read,write&state=${state}`;
    return { url, statusCode: 302 };
  }

  @Get('callback')
  @Public()
  @Redirect()
  async callback(@Query('code') code: string, @Query('state') state: string) {
    const orgId = Buffer.from(state, 'base64url').toString('utf8');
    await this.connectLinear.execute({ orgId, code, redirectUri: this.buildCallbackUrl() });
    const appUrl = this.config.getOrThrow('APP_URL');
    return { url: `${appUrl}/settings?linear=connected`, statusCode: 302 };
  }

  private buildCallbackUrl(): string {
    const apiUrl = this.config.getOrThrow('API_URL');
    return `${apiUrl}/integrations/linear/callback`;
  }
}
