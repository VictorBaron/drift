import { Injectable } from '@nestjs/common';
import type { ProjectJSON } from '@/projects/domain/aggregates/project.aggregate';

export interface AppHomeProjectSummary {
  project: ProjectJSON;
  health: string | null;
  progress: number | null;
}

@Injectable()
export class AppHomeBuilderService {
  buildOnboardingView(webUrl: string) {
    return {
      type: 'home',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '👋 Welcome to Drift!' },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Drift reads your Slack channels, Linear tickets and Notion specs to automatically generate a weekly project status report — so your Product and Engineering teams stay aligned.',
          },
        },
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Get started in 3 easy steps:*\n1. Create your first project\n2. Connect Slack channels, Linear and Notion\n3. Set your product objective',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Setup your first project →' },
              style: 'primary',
              action_id: 'open_onboarding',
              url: `${webUrl}/onboarding`,
            },
          ],
        },
      ],
    };
  }

  buildProjectsView(summaries: AppHomeProjectSummary[], webUrl: string) {
    const projectBlocks = summaries.flatMap((s) => this.buildProjectBlock(s));

    return {
      type: 'home',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '📊 Project Status' },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${summaries.length} active project${summaries.length === 1 ? '' : 's'}* — here's your weekly snapshot:`,
          },
        },
        { type: 'divider' },
        ...projectBlocks,
        { type: 'divider' },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard' },
              style: 'primary',
              action_id: 'open_dashboard',
              url: `${webUrl}/dashboard`,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Add a Project' },
              action_id: 'open_onboarding',
              url: `${webUrl}/onboarding`,
            },
          ],
        },
      ],
    };
  }

  private buildProjectBlock({ project, health, progress }: AppHomeProjectSummary) {
    const healthEmoji = this.healthEmoji(health);
    const progressText = progress !== null ? `${progress}%` : '—';
    const text = `${project.emoji} *${project.name}*\n${healthEmoji} ${this.healthLabel(health)} · Progress: ${progressText}`;

    return [
      {
        type: 'section',
        text: { type: 'mrkdwn', text },
      },
    ];
  }

  private healthEmoji(health: string | null): string {
    switch (health) {
      case 'on-track':
        return '🟢';
      case 'at-risk':
        return '🟡';
      case 'off-track':
        return '🔴';
      default:
        return '⚪';
    }
  }

  private healthLabel(health: string | null): string {
    switch (health) {
      case 'on-track':
        return 'On Track';
      case 'at-risk':
        return 'At Risk';
      case 'off-track':
        return 'Off Track';
      default:
        return 'No report yet';
    }
  }
}
