import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberRepository } from '@/accounts/domain/repositories/member.repository';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly memberRepo: MemberRepository,
    private readonly orgRepo: OrganizationRepository,
    private readonly config: ConfigService,
  ) {}

  async slackSignIn(code: string): Promise<{ memberId: string; orgId: string }> {
    const apiUrl = this.config.getOrThrow<string>('API_URL');
    const redirectUri = `${apiUrl}/auth/slack/signin/callback`;

    const params = new URLSearchParams({
      code,
      client_id: this.config.getOrThrow('SLACK_CLIENT_ID'),
      client_secret: this.config.getOrThrow('SLACK_CLIENT_SECRET'),
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch('https://slack.com/api/openid.connect.token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const tokens = (await tokenRes.json()) as { ok: boolean; id_token?: string };
    if (!tokens.ok || !tokens.id_token) {
      throw new UnauthorizedException('Slack token exchange failed');
    }

    const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString('utf-8')) as {
      'https://slack.com/user_id'?: string;
    };

    const slackUserId = payload['https://slack.com/user_id'];
    if (!slackUserId) throw new UnauthorizedException('Could not extract Slack user ID');

    const member = await this.memberRepo.findBySlackUserId(slackUserId);
    if (!member) throw new NotFoundException('No Drift account found. Please install Drift to your workspace first.');

    return { memberId: member.getId(), orgId: member.getOrganizationId() };
  }

  async getMe(memberId: string) {
    const member = await this.memberRepo.findById(memberId);
    if (!member) throw new NotFoundException('Member not found');

    const organization = await this.orgRepo.findById(member.getOrganizationId());
    if (!organization) throw new NotFoundException('Organization not found');

    const org = organization.toJSON();

    return {
      member: member.toJSON(),
      organization: {
        id: org.id,
        name: org.name,
        slackTeamId: org.slackTeamId,
        hasLinear: org.linearAccessToken !== null,
        createdAt: org.createdAt,
      },
    };
  }
}
