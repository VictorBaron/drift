import { Controller, Get, NotFoundException, Query, Redirect } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrentUser, type JwtPayload } from 'auth/current-user.decorator';
import { Public } from 'auth/public.decorator';
import { TokenEncryption } from 'auth/token-encryption';

import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';

@Controller('integrations/linear')
export class LinearAuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly orgRepo: OrganizationRepository,
    private readonly tokenEncryption: TokenEncryption,
  ) {}

  @Get('connect')
  @Redirect()
  connect(@CurrentUser() user: JwtPayload) {
    const state = Buffer.from(user.orgId).toString('base64url');
    const clientId = this.config.getOrThrow('LINEAR_CLIENT_ID');
    const apiUrl = this.config.getOrThrow('API_URL');
    const redirectUri = `${apiUrl}/integrations/linear/callback`;
    const url = `https://linear.app/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read&state=${state}`;
    return { url, statusCode: 302 };
  }

  @Get('callback')
  @Public()
  @Redirect()
  async callback(@Query('code') code: string, @Query('state') state: string) {
    const orgId = Buffer.from(state, 'base64url').toString('utf8');
    const token = await this.exchangeCodeForToken(code);
    const org = await this.orgRepo.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    org.connectLinear(this.tokenEncryption.encrypt(token));
    await this.orgRepo.save(org);
    const appUrl = this.config.getOrThrow('APP_URL');
    return { url: `${appUrl}/settings?linear=connected`, statusCode: 302 };
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    const clientId = this.config.getOrThrow('LINEAR_CLIENT_ID');
    const clientSecret = this.config.getOrThrow('LINEAR_CLIENT_SECRET');
    const apiUrl = this.config.getOrThrow('API_URL');
    const redirectUri = `${apiUrl}/integrations/linear/callback`;

    const response = await fetch('https://api.linear.app/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!response.ok) throw new Error(`Linear token exchange failed: ${response.statusText}`);
    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }
}
