import { Injectable } from '@nestjs/common';
import type { LinearTicketSnapshot } from '@/integrations/linear/domain/aggregates/linear-ticket-snapshot.aggregate';
import { LinearTicketSnapshotRepository } from '@/integrations/linear/domain/repositories/linear-ticket-snapshot.repository';

export interface ComputeDeliveryStatsInput {
  projectId: string;
  weekStart: Date;
  weekEnd: Date;
}

export interface DeliveryStats {
  merged: number;
  inReview: number;
  blocked: number;
  created: number;
  velocity: string;
  velocityLabel: string;
}

@Injectable()
export class ComputeDeliveryStatsHandler {
  constructor(private readonly snapshotRepo: LinearTicketSnapshotRepository) {}

  async execute(input: ComputeDeliveryStatsInput): Promise<DeliveryStats> {
    const currentSnapshots = await this.getDeduplicatedSnapshots(input.projectId, input.weekStart);
    const prevWeekStart = new Date(input.weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevSnapshots = await this.getDeduplicatedSnapshots(input.projectId, prevWeekStart);

    const merged = this.countMerged(currentSnapshots);
    const inReview = this.countInReview(currentSnapshots);
    const blocked = this.countBlocked(currentSnapshots);
    const created = currentSnapshots.length;
    const velocity = this.computeVelocity(merged, this.countMerged(prevSnapshots));

    return {
      merged,
      inReview,
      blocked,
      created,
      velocity: velocity.formatted,
      velocityLabel: 'vs last week',
    };
  }

  private async getDeduplicatedSnapshots(projectId: string, weekStart: Date): Promise<LinearTicketSnapshot[]> {
    const snapshots = await this.snapshotRepo.findByProjectAndWeek(projectId, weekStart);
    return this.deduplicateByIssueId(snapshots);
  }

  private deduplicateByIssueId(snapshots: LinearTicketSnapshot[]): LinearTicketSnapshot[] {
    const byIssueId = new Map<string, LinearTicketSnapshot>();

    for (const snapshot of snapshots) {
      const issueId = snapshot.getLinearIssueId();
      const existing = byIssueId.get(issueId);
      if (!existing || snapshot.toJSON().snapshotDate > existing.toJSON().snapshotDate) {
        byIssueId.set(issueId, snapshot);
      }
    }

    return Array.from(byIssueId.values());
  }

  private countMerged(snapshots: LinearTicketSnapshot[]): number {
    return snapshots.filter((s) => s.getStateType() === 'completed').length;
  }

  private countInReview(snapshots: LinearTicketSnapshot[]): number {
    return snapshots.filter((s) => s.toJSON().stateName.toLowerCase().includes('review')).length;
  }

  private countBlocked(snapshots: LinearTicketSnapshot[]): number {
    return snapshots.filter((s) => {
      const json = s.toJSON();
      const hasBlockedLabel = json.labelNames.some((l) => l.toLowerCase() === 'blocked');
      const isUrgent = json.priority === 1;
      return hasBlockedLabel || isUrgent;
    }).length;
  }

  private computeVelocity(currentMerged: number, prevMerged: number): { formatted: string } {
    if (prevMerged === 0) {
      if (currentMerged === 0) return { formatted: '+0%' };
      return { formatted: '+100%' };
    }

    const change = Math.round(((currentMerged - prevMerged) / prevMerged) * 100);
    const sign = change >= 0 ? '+' : '';
    return { formatted: `${sign}${change}%` };
  }
}
