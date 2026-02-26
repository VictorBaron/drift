import { Injectable } from '@nestjs/common';
import type { DeliveryStats } from '@/integrations/linear/application/queries/compute-delivery-stats/compute-delivery-stats.query';
import type { LinearTicketSnapshot } from '@/integrations/linear/domain/aggregates/linear-ticket-snapshot.aggregate';
import type { SlackMessage } from '@/integrations/slack/domain/aggregates/slack-message.aggregate';
import type { Project, ProjectJSON } from '@/projects/domain/aggregates/project.aggregate';
import type { Report, ReportJSON } from '@/reports/domain/aggregates/report.aggregate';

export interface PipelineData {
  project: Project;
  slackMessages: SlackMessage[];
  linearSnapshots: LinearTicketSnapshot[];
  deliveryStats: DeliveryStats;
  notionContent: string | null;
  previousReport: Report | null;
}

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
}

@Injectable()
export class PromptBuilderService {
  buildPrompt(data: PipelineData): BuiltPrompt {
    return {
      systemPrompt: this.buildSystemPrompt(),
      userPrompt: this.buildUserPrompt(data),
    };
  }

  private buildSystemPrompt(): string {
    return `You are Drift, an AI assistant that generates structured weekly project status reports for Product and Engineering leadership. You analyze raw data from Slack conversations, Linear tickets, and Notion specs to produce accurate, insightful project reports.

Your reports serve two audiences simultaneously:
- The CTO/VP Engineering: cares about delivery velocity, blockers, technical risks, team bandwidth
- The CPO/Head of Product: cares about alignment with product intent, decision traceability, scope drift, KR impact

CRITICAL RULES:
1. Only report facts you can verify from the provided data. Never invent or hallucinate information.
2. Distinguish clearly between DECISIONS MADE (someone explicitly committed to a course of action) vs DISCUSSIONS IN PROGRESS (options being explored, no commitment).
3. When you identify a decision, always note WHO made it, WHERE (which channel/tool), and the TRADE-OFF involved.
4. Be precise about blockers: what is blocked, who owns it, how long it's been blocked, and what's the impact.
5. For intent drift: compare what's being built/discussed against the Product Objective and Key Results provided. Flag any divergence, even subtle ones.
6. Progress percentage should reflect overall project completion based on KR status, ticket completion, and your assessment of remaining work — NOT just ticket count.
7. Health assessment must be justified by specific evidence from the data.
8. Write the narrative in a style that's informative but concise — like a senior PM briefing leadership. No fluff, no filler, every sentence carries information.
9. Your output MUST be valid JSON matching the exact schema provided. No markdown, no commentary outside the JSON.`;
  }

  private buildUserPrompt(data: PipelineData): string {
    const projectJson = data.project.toJSON();
    const prevReport = data.previousReport?.toJSON() ?? null;

    const sections = [
      'Generate a weekly project status report based on the following data.',
      '',
      this.buildProjectInfoSection(projectJson, prevReport),
      '',
      this.buildProductObjectiveSection(projectJson),
      '',
      this.buildNotionSection(data.notionContent),
      '',
      this.buildSlackSection(data.slackMessages),
      '',
      this.buildLinearSection(data.linearSnapshots),
      '',
      this.buildDeliveryMetricsSection(data.deliveryStats),
      '',
      this.buildOutputFormatSection(),
    ];

    return sections.join('\n');
  }

  private buildProjectInfoSection(projectJson: ProjectJSON, prevReport: ReportJSON | null): string {
    const daysToTarget = projectJson.targetDate
      ? Math.ceil((projectJson.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return [
      '## PROJECT INFO',
      `- Name: ${projectJson.name}`,
      `- Team: ${projectJson.teamName ?? 'N/A'}`,
      `- PM Lead: ${projectJson.pmLeadName ?? 'N/A'}`,
      `- Tech Lead: ${projectJson.techLeadName ?? 'N/A'}`,
      `- Week Number: ${projectJson.weekNumber}`,
      `- Target Date: ${projectJson.targetDate ? projectJson.targetDate.toISOString().split('T')[0] : 'N/A'}`,
      `- Days to Target: ${daysToTarget ?? 'N/A'}`,
      `- Previous Week Progress: ${prevReport ? prevReport.progress : 'N/A (first report)'}`,
      `- Previous Week Health: ${prevReport ? prevReport.health : 'N/A'}`,
    ].join('\n');
  }

  private buildProductObjectiveSection(projectJson: ProjectJSON): string {
    const krLines = projectJson.keyResults.map((kr) => `- [${kr.done ? 'x' : ' '}] ${kr.text}`);
    return [
      '## PRODUCT OBJECTIVE',
      `Goal: ${projectJson.productObjective ?? 'Not defined'}`,
      `Origin: ${projectJson.objectiveOrigin ?? 'N/A'}`,
      'Key Results:',
      ...krLines,
    ].join('\n');
  }

  private buildNotionSection(content: string | null): string {
    return [
      '## NOTION SPEC CONTENT (Product Intent Reference)',
      content ?? 'No Notion page configured for this project.',
    ].join('\n');
  }

  private buildSlackSection(messages: SlackMessage[]): string {
    const lines = ['## SLACK CONVERSATIONS (last 7 days, filtered for relevance)'];
    const byChannel = this.groupByChannel(messages);

    for (const [channelId, channelMessages] of byChannel) {
      lines.push(`Channel: ${channelId}`);
      const threadParents = this.getThreadParents(channelMessages);
      for (const msg of threadParents) {
        lines.push(...this.formatMessageWithReplies(msg, channelMessages));
      }
    }

    return lines.join('\n');
  }

  private groupByChannel(messages: SlackMessage[]): Map<string, SlackMessage[]> {
    const map = new Map<string, SlackMessage[]>();
    for (const msg of messages) {
      const channelId = msg.toJSON().channelId;
      if (!map.has(channelId)) map.set(channelId, []);
      map.get(channelId)!.push(msg);
    }
    return map;
  }

  private getThreadParents(messages: SlackMessage[]): SlackMessage[] {
    return messages.filter((m) => {
      const json = m.toJSON();
      return !json.threadTs || json.threadTs === json.messageTs;
    });
  }

  private formatMessageWithReplies(parent: SlackMessage, allMessages: SlackMessage[]): string[] {
    const parentJson = parent.toJSON();
    const ts = new Date(Number.parseFloat(parentJson.messageTs) * 1000).toISOString();
    const lines = [`[${ts}] ${parentJson.userName}: ${parentJson.text}`];

    const replies = allMessages.filter(
      (r) => r.toJSON().threadTs === parentJson.messageTs && r.toJSON().messageTs !== parentJson.messageTs,
    );

    if (replies.length > 0) {
      lines.push('  Thread replies:');
      for (const reply of replies) {
        const replyJson = reply.toJSON();
        const replyTs = new Date(Number.parseFloat(replyJson.messageTs) * 1000).toISOString();
        lines.push(`  -> [${replyTs}] ${replyJson.userName}: ${replyJson.text}`);
      }
    }

    return lines;
  }

  private buildLinearSection(snapshots: LinearTicketSnapshot[]): string {
    const lines = ['## LINEAR TICKETS (current state)'];
    for (const snapshot of snapshots) {
      const json = snapshot.toJSON();
      lines.push(`- ${json.identifier}: ${json.title}`);
      lines.push(
        `  Status: ${json.stateName} | Priority: ${this.priorityLabel(json.priority)} | Assignee: ${json.assigneeName ?? 'Unassigned'}`,
      );
    }
    return lines.join('\n');
  }

  private priorityLabel(priority: number): string {
    const labels: Record<number, string> = { 0: 'None', 1: 'Urgent', 2: 'High', 3: 'Medium', 4: 'Low' };
    return labels[priority] ?? 'Unknown';
  }

  private buildDeliveryMetricsSection(stats: DeliveryStats): string {
    return [
      '## DELIVERY METRICS (computed from Linear)',
      `- Tickets merged this week: ${stats.merged}`,
      `- In review: ${stats.inReview}`,
      `- Blocked: ${stats.blocked}`,
      `- Created this week: ${stats.created}`,
    ].join('\n');
  }

  private buildOutputFormatSection(): string {
    return `## OUTPUT FORMAT
Respond with a single JSON object matching this exact schema. No markdown, no extra text — ONLY the JSON:

{
  "health": "on-track" | "at-risk" | "off-track",
  "healthLabel": "On Track" | "At Risk" | "Off Track",
  "progress": <number 0-100>,
  "narrative": "<2-4 sentence weekly summary>",
  "decisions": [
    {
      "text": "<what was decided>",
      "tradeoff": "<what's gained vs what's lost>",
      "who": "<person(s) who made the decision>",
      "where": "<Slack channel or Linear ticket>",
      "when": "<day of the week>",
      "alignedWithIntent": true | false | "partial"
    }
  ],
  "drift": {
    "level": "none" | "low" | "high",
    "label": "Aligned" | "Minor Drift" | "Significant Drift",
    "details": "<explanation of divergence, or 'Implementation matches original spec.' if none>"
  },
  "blockers": [
    {
      "text": "<what is blocked>",
      "owner": "<person responsible>",
      "severity": "high" | "medium" | "low",
      "since": "<duration>",
      "impact": "<consequence if not resolved>"
    }
  ],
  "keyResults": [
    { "text": "<KR text>", "done": <boolean> }
  ],
  "threads": [
    {
      "title": "<summary of the thread topic>",
      "participants": ["<name>", ...],
      "messages": <number>,
      "outcome": "<Decision: X | Open — needs Y | Investigation ongoing>",
      "channel": "<#channel-name>"
    }
  ],
  "delivery": {
    "merged": <number>,
    "inReview": <number>,
    "blocked": <number>,
    "created": <number>,
    "velocity": "<+X% or -X%>",
    "velocityLabel": "vs last week"
  },
  "sourceCounts": {
    "slack": <number of messages analyzed>,
    "linear": <number of tickets analyzed>,
    "notion": <0 or 1>
  }
}`;
  }
}
