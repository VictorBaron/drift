import { Injectable } from '@nestjs/common';

import type { Project } from '@/projects/domain/aggregates/project.aggregate';
import type { ReportContent } from '@/reports/domain/aggregates/report.aggregate';

@Injectable()
export class SlackReportFormatterService {
  formatReport(
    content: ReportContent,
    project: Project,
    weekNumber: number,
    prevProgress: number,
    periodLabel: string,
  ): unknown[] {
    const blocks: unknown[] = [
      this.buildHeader(content, project, weekNumber, prevProgress),
      this.buildDivider(),
      this.buildObjective(content, project),
      this.buildDivider(),
      this.buildNarrative(content),
    ];

    if (content.decisions.length > 0) {
      blocks.push(this.buildDivider(), this.buildDecisions(content));
    }

    if (content.drift.level !== 'none') {
      blocks.push(this.buildDivider(), this.buildDrift(content));
    }

    if (content.blockers.length > 0) {
      blocks.push(this.buildDivider(), this.buildBlockers(content));
    }

    blocks.push(this.buildDivider(), this.buildDelivery(content), this.buildDivider(), this.buildFooter(periodLabel));

    return blocks;
  }

  formatPortfolioSummary(summaries: ProjectReportSummary[], weekNumber: number): unknown[] {
    const lines = summaries.map((s) => {
      const emoji = this.healthEmoji(s.health);
      const diff = s.progress - s.prevProgress;
      const diffText = diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '=';
      return `${emoji} *${s.projectEmoji} ${s.projectName}* — ${s.healthLabel} · ${s.progress}% (${diffText})`;
    });

    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📊 Weekly Portfolio Summary — Week ${weekNumber}*`,
        },
      },
      this.buildDivider(),
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: lines.join('\n'),
        },
      },
    ];
  }

  private buildHeader(content: ReportContent, project: Project, weekNumber: number, prevProgress: number): unknown {
    const healthEmoji = this.healthEmoji(content.health);
    const diff = content.progress - prevProgress;
    const diffText = diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '=';

    const leads: string[] = [];
    const pmLead = project.getPmLeadName();
    const techLead = project.getTechLeadName();
    if (pmLead) leads.push(`PM: ${pmLead}`);
    if (techLead) leads.push(`Tech: ${techLead}`);
    const leadsLine = leads.length > 0 ? `\n${leads.join(' · ')}` : '';

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${project.getEmoji()} *${project.getName()}* — Week ${weekNumber}\n${healthEmoji} ${content.healthLabel} · Progress: ${content.progress}% (${diffText})${leadsLine}`,
      },
    };
  }

  private buildObjective(content: ReportContent, project: Project): unknown {
    const objective = project.getProductObjective();
    const krs = project.getKeyResults();
    const objectiveLine = objective ? `\n${objective}` : '';
    const krLines = krs.map((kr) => `${kr.done ? '✅' : '☐'} ${kr.text}`).join('\n');
    const krSection = krLines ? `\n${krLines}` : '';

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🎯 Objective*${objectiveLine}${krSection}`,
      },
    };
  }

  private buildNarrative(content: ReportContent): unknown {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📝 This Week*\n${content.narrative}`,
      },
    };
  }

  private buildDecisions(content: ReportContent): unknown {
    const lines = content.decisions.map((d) => {
      const aligned =
        d.alignedWithIntent === true ? '✅ Aligned' : d.alignedWithIntent === 'partial' ? '⚠️ Partial' : '❌ Divergent';
      return `• ${d.text}\n  ↳ ${aligned} · Trade-off: ${d.tradeoff}`;
    });

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*⚡ Decisions*\n${lines.join('\n')}`,
      },
    };
  }

  private buildDrift(content: ReportContent): unknown {
    const driftEmoji = content.drift.level === 'high' ? '🔴' : '⚠️';

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${driftEmoji} Intent Drift: ${content.drift.label}*\n${content.drift.details}`,
      },
    };
  }

  private buildBlockers(content: ReportContent): unknown {
    const lines = content.blockers.map((b) => {
      const emoji = b.severity === 'high' ? '🔴' : b.severity === 'medium' ? '🟡' : '🔵';
      return `${emoji} ${b.text} — Owner: ${b.owner}`;
    });

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🚧 Blockers (${content.blockers.length})*\n${lines.join('\n')}`,
      },
    };
  }

  private buildDelivery(content: ReportContent): unknown {
    const { merged, inReview, blocked, velocity, velocityLabel } = content.delivery;

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📊 Delivery*\n✅ ${merged} merged · 🔄 ${inReview} in review · 🔴 ${blocked} blocked\n📈 Velocity: ${velocity} ${velocityLabel}`,
      },
    };
  }

  private buildFooter(periodLabel: string): unknown {
    return {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🔗 View full report on Drift · ${periodLabel}`,
        },
      ],
    };
  }

  private buildDivider(): unknown {
    return { type: 'divider' };
  }

  private healthEmoji(health: string): string {
    if (health === 'on-track') return '🟢';
    if (health === 'at-risk') return '🟡';
    return '🔴';
  }
}

export interface ProjectReportSummary {
  projectName: string;
  projectEmoji: string;
  health: string;
  healthLabel: string;
  progress: number;
  prevProgress: number;
}
