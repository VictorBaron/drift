import { Injectable, OnModuleInit } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackService implements OnModuleInit {
  private bolt: App;
  public receiver: ExpressReceiver;

  constructor(private config: ConfigService) {
    this.receiver = new ExpressReceiver({
      signingSecret: this.config.get('SLACK_SIGNING_SECRET'),
      clientId: this.config.get('SLACK_CLIENT_ID'),
      clientSecret: this.config.get('SLACK_CLIENT_SECRET'),
      stateSecret: 'your-state-secret', // Change this
      scopes: ['chat:write', 'users:read'],
      userScopes: [
        'channels:history',
        'groups:history',
        'im:history',
        'mpim:history',
        'channels:read',
        'groups:read',
        'im:read',
        'mpim:read',
        'users:read',
      ],
      installationStore: {
        storeInstallation: async (installation) => {
          // TODO: Save to database in Phase 2
          console.log('Installation:', installation);
        },
        fetchInstallation: async (installQuery) => {
          // TODO: Fetch from database in Phase 2
          throw new Error('Not implemented');
        },
      },
    });

    this.bolt = new App({
      receiver: this.receiver,
    });
  }

  onModuleInit() {
    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    // Log all messages for now
    this.bolt.event('message', async ({ event, context }) => {
      console.log('Message received:', {
        user: event.user,
        channel: event.channel,
        text: event.text,
        ts: event.ts,
        userToken: context.userToken ? 'present' : 'missing',
      });
    });

    this.bolt.event('reaction_added', async ({ event }) => {
      console.log('Reaction added:', {
        user: event.user,
        reaction: event.reaction,
        itemUser: event.item_user,
      });
    });
  }

  getExpressApp() {
    return this.receiver.app;
  }
}
