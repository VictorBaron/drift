import type { Application } from 'express';

export const SLACK_GATEWAY = 'SLACK_GATEWAY';

export interface SlackGateway {
  getExpressApp(): Application;
}
