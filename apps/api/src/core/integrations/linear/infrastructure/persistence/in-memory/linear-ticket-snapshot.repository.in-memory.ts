import { RepositoryInMemory } from 'common/domain/repository.in-memory';

import type { LinearTicketSnapshot } from '@/integrations/linear/domain/aggregates/linear-ticket-snapshot.aggregate';
import type { LinearTicketSnapshotRepository } from '@/integrations/linear/domain/repositories/linear-ticket-snapshot.repository';

export class LinearTicketSnapshotRepositoryInMemory
  extends RepositoryInMemory<LinearTicketSnapshot>
  implements LinearTicketSnapshotRepository
{
  findByProjectAndWeek(projectId: string, weekStart: Date): Promise<LinearTicketSnapshot[]> {
    return this.filter(
      (snapshot) =>
        snapshot.getProjectId() === projectId && snapshot.toJSON().snapshotWeekStart.getTime() === weekStart.getTime(),
    );
  }

  async findLatestByProjectId(projectId: string): Promise<LinearTicketSnapshot | null> {
    const all = await this.filter((s) => s.getProjectId() === projectId);
    if (all.length === 0) return null;
    return all.sort((a, b) => b.toJSON().snapshotDate.getTime() - a.toJSON().snapshotDate.getTime())[0];
  }

  async saveMany(snapshots: LinearTicketSnapshot[]): Promise<LinearTicketSnapshot[]> {
    for (const snapshot of snapshots) {
      await this.save(snapshot);
    }
    return snapshots;
  }
}
