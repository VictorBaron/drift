import { Test } from '@nestjs/testing';

import { LinearTicketSnapshot } from '@/integrations/linear/domain/aggregates/linear-ticket-snapshot.aggregate';
import { LinearTicketSnapshotRepository } from '@/integrations/linear/domain/repositories/linear-ticket-snapshot.repository';
import { LinearTicketSnapshotRepositoryInMemory } from '@/integrations/linear/infrastructure/persistence/in-memory/linear-ticket-snapshot.repository.in-memory';

import { ComputeDeliveryStatsHandler, type ComputeDeliveryStatsInput } from './compute-delivery-stats.query';

const PROJECT_ID = 'project-1';
const ORG_ID = 'org-1';
const WEEK_START = new Date('2026-02-23T00:00:00.000Z'); // Monday
const WEEK_END = new Date('2026-03-01T00:00:00.000Z');
const PREV_WEEK_START = new Date('2026-02-16T00:00:00.000Z');

function makeSnapshot(overrides: {
  linearIssueId?: string;
  stateName?: string;
  stateType?: string;
  priority?: number;
  labelNames?: string[];
  snapshotWeekStart?: Date;
  snapshotDate?: Date;
}): LinearTicketSnapshot {
  return LinearTicketSnapshot.snapshot({
    organizationId: ORG_ID,
    projectId: PROJECT_ID,
    linearIssueId: overrides.linearIssueId ?? crypto.randomUUID(),
    identifier: 'PRJ-1',
    title: 'Test',
    description: null,
    stateName: overrides.stateName ?? 'In Progress',
    stateType: overrides.stateType ?? 'started',
    priority: overrides.priority ?? 3,
    assigneeName: null,
    labelNames: overrides.labelNames ?? [],
    commentCount: 0,
    snapshotDate: overrides.snapshotDate ?? new Date('2026-02-25'),
    snapshotWeekStart: overrides.snapshotWeekStart ?? WEEK_START,
  });
}

describe('ComputeDeliveryStats', () => {
  let handler: ComputeDeliveryStatsHandler;
  let snapshotRepo: LinearTicketSnapshotRepositoryInMemory;

  const defaultInput: ComputeDeliveryStatsInput = {
    projectId: PROJECT_ID,
    weekStart: WEEK_START,
    weekEnd: WEEK_END,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ComputeDeliveryStatsHandler,
        { provide: LinearTicketSnapshotRepository, useClass: LinearTicketSnapshotRepositoryInMemory },
      ],
    }).compile();

    handler = module.get<ComputeDeliveryStatsHandler>(ComputeDeliveryStatsHandler);
    snapshotRepo = module.get<LinearTicketSnapshotRepositoryInMemory>(LinearTicketSnapshotRepository);

    snapshotRepo.clear();
  });

  describe('when no snapshots exist', () => {
    it('should return all zeros', async () => {
      const result = await handler.execute(defaultInput);

      expect(result).toEqual({
        merged: 0,
        inReview: 0,
        blocked: 0,
        created: 0,
        velocity: '+0%',
        velocityLabel: 'vs last week',
      });
    });
  });

  describe('when snapshots exist for current week', () => {
    it('should count merged as completed stateType', async () => {
      await snapshotRepo.save(makeSnapshot({ stateType: 'completed', stateName: 'Done' }));
      await snapshotRepo.save(makeSnapshot({ stateType: 'started', stateName: 'In Progress' }));

      const result = await handler.execute(defaultInput);

      expect(result.merged).toBe(1);
      expect(result.created).toBe(2);
    });

    it('should count inReview when stateName includes review', async () => {
      await snapshotRepo.save(makeSnapshot({ stateName: 'In Review' }));
      await snapshotRepo.save(makeSnapshot({ stateName: 'Code Review' }));
      await snapshotRepo.save(makeSnapshot({ stateName: 'In Progress' }));

      const result = await handler.execute(defaultInput);

      expect(result.inReview).toBe(2);
    });

    it('should count blocked when labelNames includes Blocked or priority is 1', async () => {
      await snapshotRepo.save(makeSnapshot({ labelNames: ['Blocked'] }));
      await snapshotRepo.save(makeSnapshot({ priority: 1 }));
      await snapshotRepo.save(makeSnapshot({ priority: 3 }));

      const result = await handler.execute(defaultInput);

      expect(result.blocked).toBe(2);
    });

    it('should count blocked case-insensitively for label', async () => {
      await snapshotRepo.save(makeSnapshot({ labelNames: ['blocked'] }));

      const result = await handler.execute(defaultInput);

      expect(result.blocked).toBe(1);
    });
  });

  describe('deduplication', () => {
    it('should keep latest snapshot per issue id', async () => {
      const issueId = 'issue-dup';
      await snapshotRepo.save(
        makeSnapshot({ linearIssueId: issueId, stateType: 'started', snapshotDate: new Date('2026-02-24') }),
      );
      await snapshotRepo.save(
        makeSnapshot({ linearIssueId: issueId, stateType: 'completed', snapshotDate: new Date('2026-02-25') }),
      );

      const result = await handler.execute(defaultInput);

      expect(result.merged).toBe(1);
      expect(result.created).toBe(1);
    });
  });

  describe('velocity', () => {
    it('should compute velocity compared to previous week', async () => {
      // Previous week: 2 completed
      await snapshotRepo.save(
        makeSnapshot({
          stateType: 'completed',
          snapshotWeekStart: PREV_WEEK_START,
          snapshotDate: new Date('2026-02-18'),
        }),
      );
      await snapshotRepo.save(
        makeSnapshot({
          stateType: 'completed',
          snapshotWeekStart: PREV_WEEK_START,
          snapshotDate: new Date('2026-02-19'),
        }),
      );

      // Current week: 3 completed
      await snapshotRepo.save(makeSnapshot({ stateType: 'completed' }));
      await snapshotRepo.save(makeSnapshot({ stateType: 'completed' }));
      await snapshotRepo.save(makeSnapshot({ stateType: 'completed' }));

      const result = await handler.execute(defaultInput);

      expect(result.velocity).toBe('+50%');
      expect(result.velocityLabel).toBe('vs last week');
    });

    it('should show +100% when previous week had 0 merged', async () => {
      await snapshotRepo.save(makeSnapshot({ stateType: 'completed' }));

      const result = await handler.execute(defaultInput);

      expect(result.velocity).toBe('+100%');
    });

    it('should show negative velocity when current week is lower', async () => {
      // Previous week: 4 completed
      for (let i = 0; i < 4; i++) {
        await snapshotRepo.save(
          makeSnapshot({
            stateType: 'completed',
            snapshotWeekStart: PREV_WEEK_START,
            snapshotDate: new Date('2026-02-18'),
          }),
        );
      }
      // Current week: 2 completed
      await snapshotRepo.save(makeSnapshot({ stateType: 'completed' }));
      await snapshotRepo.save(makeSnapshot({ stateType: 'completed' }));

      const result = await handler.execute(defaultInput);

      expect(result.velocity).toBe('-50%');
    });
  });
});
