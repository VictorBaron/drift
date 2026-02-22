import type { Message } from '../types';

export interface UrgentMessageDTO {
  id: string;
  text: string;
  score: number;
  reasoning: string | null;
  sender: { name: string | null; email: string };
  channel: { name: string | null; type: string };
  slackLink: string;
  createdAt: string;
}

let nextId = 100;
export function uid(): string {
  return String(nextId++);
}

export function formatTimeAgo(date: Date): string {
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export function dtoToMessage(dto: UrgentMessageDTO): Message {
  return {
    id: dto.id,
    title: dto.sender.name ?? dto.sender.email,
    description: dto.text.length > 70 ? dto.text.slice(0, 70) + '…' : dto.text,
    body: dto.text,
    source: 'Slack',
    timeAgo: formatTimeAgo(new Date(dto.createdAt)),
    score: dto.score,
    channelLabel: dto.channel.name ? `#${dto.channel.name}` : null,
    slackLink: dto.slackLink,
  };
}

export const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    title: 'Server Outage',
    description: 'Blocking 3 engineers (prod incident)',
    body: 'Production server is down, impacting the app. Need assistance ASAP!',
    source: 'Slack',
    timeAgo: '5m ago',
    score: 91,
    channelLabel: 'Blocking 3 engineers (prod incident)',
    slackLink: 'https://app.slack.com',
  },
  {
    id: '2',
    title: 'VIP Customer Issue',
    description: 'Client waiting on urgent response',
    body: 'A VIP client is waiting for an urgent response. They have raised a critical support ticket that needs immediate attention.',
    source: 'Slack',
    timeAgo: '10m ago',
    score: 85,
    channelLabel: 'vip-customers',
    slackLink: 'https://app.slack.com',
  },
  {
    id: '3',
    title: 'Code Review Needed',
    description: 'PR stuck, waiting on approval',
    body: "This PR has been waiting for code review. It's blocking the release pipeline for the v2 launch.",
    source: 'Slack',
    timeAgo: '20m ago',
    score: 78,
    channelLabel: 'engineering',
    slackLink: 'https://app.slack.com',
  },
  {
    id: '4',
    title: 'Meeting Reminder',
    description: 'Team sync in 20 minutes',
    body: 'Your team sync meeting starts in 20 minutes. Agenda: sprint review, blockers, and Q2 planning.',
    source: 'Calendar',
    timeAgo: '25m ago',
    score: 60,
    channelLabel: null,
    slackLink: null,
  },
  {
    id: '5',
    title: 'Article to Review',
    description: 'FYI: New draft for feedback',
    body: "A new blog article draft has been shared for your review and feedback before next week's release.",
    source: 'Slack',
    timeAgo: '40m ago',
    score: 45,
    channelLabel: 'content-team',
    slackLink: 'https://app.slack.com',
  },
];
