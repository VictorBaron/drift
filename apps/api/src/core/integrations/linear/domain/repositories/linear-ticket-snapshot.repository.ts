import { RepositoryPort } from 'common/domain';

import type { LinearTicketSnapshot } from '../aggregates/linear-ticket-snapshot.aggregate';

export abstract class LinearTicketSnapshotRepository extends RepositoryPort<LinearTicketSnapshot> {
  abstract findByProjectAndWeek(projectId: string, weekStart: Date): Promise<LinearTicketSnapshot[]>;
  abstract findLatestByProjectId(projectId: string): Promise<LinearTicketSnapshot | null>;
  abstract saveMany(snapshots: LinearTicketSnapshot[]): Promise<LinearTicketSnapshot[]>;
}
