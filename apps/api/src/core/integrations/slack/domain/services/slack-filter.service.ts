import { Injectable } from '@nestjs/common';

import type { SlackMessage } from '../aggregates/slack-message.aggregate';

@Injectable()
export class SlackFilterService {
  shouldFilter(_message: SlackMessage, _threadReplyCount: number): boolean {
    return false;
  }
}
