import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { App, ExpressReceiver, type Installation, type InstallationStore } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { TokenEncryption } from 'auth/token-encryption';
import type { Application } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  RegisterSlackInstallationCommand,
  RegisterSlackInstallationHandler,
} from '@/slack/application/commands/register-slack-installation/register-slack-installation.handler';
import { SlackGateway } from '@/slack/domain/slack.gateway';
import { INSTALLATION_STORE } from '@/slack/infrastructure/persistence/installation-store.token';
import { isGenericMessage } from '@/slack/types';

const SLACK_SCOPES = [
  'channels:history',
  'channels:read',
  'groups:history',
  'groups:read',
  'users:read',
  'users:read.email',
  'chat:write',
  'im:write',
] as const;

const USER_SCOPES = ['identity.basic', 'identity.email'] as const;

@Injectable()
export class BoltSlackGateway implements SlackGateway, OnModuleInit {
  private bolt: App;
  private receiver: ExpressReceiver;
  private readonly logger = new Logger(BoltSlackGateway.name);

  constructor(
    private config: ConfigService,
    @Inject(INSTALLATION_STORE)
    private installationStore: InstallationStore,
    private registerSlackInstallation: RegisterSlackInstallationHandler,
    private jwtService: JwtService,
    private tokenEncryption: TokenEncryption,
  ) {
    this.receiver = new ExpressReceiver({
      signingSecret: this.config.getOrThrow('SLACK_SIGNING_SECRET'),
      clientId: this.config.get('SLACK_CLIENT_ID'),
      clientSecret: this.config.get('SLACK_CLIENT_SECRET'),
      stateSecret: this.config.getOrThrow('SLACK_STATE_SECRET'),
      scopes: [...SLACK_SCOPES],
      endpoints: { events: '/events' },
      installerOptions: {
        userScopes: [...USER_SCOPES],
        installPath: '/install',
        redirectUriPath: '/oauth/callback',
        callbackOptions: {
          success: this.handleOAuthSuccess.bind(this),
        },
      },
      installationStore: this.installationStore,
      redirectUri: `${this.config.getOrThrow('SLACK_REDIRECT_URI')}/slack/oauth/callback`,
    });

    this.bolt = new App({ receiver: this.receiver });
  }

  onModuleInit() {
    this.registerEvents();
  }

  getExpressApp(): Application {
    return this.receiver.app;
  }

  private async handleOAuthSuccess(
    installation: Installation,
    _options: unknown,
    _req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const webUrl = this.config.getOrThrow<string>('WEB_URL');

    try {
      const teamId = installation.team?.id ?? null;
      const teamName = installation.team?.name ?? '';
      const botToken = installation.bot?.token;
      const userId = installation.user.id;
      const userToken = installation.user.token ?? null;

      if (!teamId || !botToken) {
        res.writeHead(302, { Location: `${webUrl}/error?code=missing_tokens` });
        res.end();
        return;
      }

      const userInfo = await new WebClient(botToken).users.info({ user: userId }).catch(() => null);
      const profile = userInfo?.user?.profile;
      const email = profile?.email ?? '';
      const name = profile?.real_name ?? userInfo?.user?.name ?? '';
      const avatarUrl = profile?.image_192 ?? null;

      const command = new RegisterSlackInstallationCommand(
        teamId,
        teamName,
        this.tokenEncryption.encrypt(botToken),
        userId,
        userToken ? this.tokenEncryption.encrypt(userToken) : null,
        email,
        name,
        avatarUrl,
      );

      const { memberId, orgId } = await this.registerSlackInstallation.execute(command);

      this.logger.log(`OAuth install: userId=${userId} teamId=${teamId} member=${memberId}`);

      const token = this.jwtService.sign({ sub: memberId, orgId });
      const isProduction = this.config.get('NODE_ENV') === 'production';
      const cookieFlags = `HttpOnly; Path=/; SameSite=Lax${isProduction ? '; Secure' : ''}`;

      res.setHeader('Set-Cookie', `session=${token}; ${cookieFlags}`);
      res.writeHead(302, { Location: `${webUrl}/dashboard` });
      res.end();
    } catch (error) {
      this.logger.error('OAuth success handler failed', error);
      res.writeHead(302, { Location: `${webUrl}/error?code=auth_failed` });
      res.end();
    }
  }

  private registerEvents() {
    this.bolt.event('message', async ({ event }) => {
      if (!isGenericMessage(event)) {
        this.logger.log(`Received non generic message of type ${event.type}`);
        return;
      }

      return;
    });

    this.bolt.event('reaction_added', async ({ event }) => {
      return;
    });
  }
}
