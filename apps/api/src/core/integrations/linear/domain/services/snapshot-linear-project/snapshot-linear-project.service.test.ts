import { Test } from '@nestjs/testing';

import { LinearTicketSnapshot } from '@/integrations/linear/domain/aggregates/linear-ticket-snapshot.aggregate';
import { LINEAR_API_GATEWAY, type LinearIssue } from '@/integrations/linear/domain/gateways/linear-api.gateway';
import { LinearTicketSnapshotRepository } from '@/integrations/linear/domain/repositories/linear-ticket-snapshot.repository';
import { FakeLinearApiGateway } from '@/integrations/linear/infrastructure/gateways/fake-linear-api.gateway';
import { LinearTicketSnapshotRepositoryInMemory } from '@/integrations/linear/infrastructure/persistence/in-memory/linear-ticket-snapshot.repository.in-memory';
import { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ProjectRepositoryInMemory } from '@/projects/infrastructure/persistence/in-memory/project.repository.in-memory';

import { SnapshotLinearProjectCommand, SnapshotLinearProjectService } from './snapshot-linear-project.service';

const LINEAR_TOKEN = 'lin_test_token';
const ORG_ID = 'org-1';
const LINEAR_PROJECT_ID = 'lp-1';
const LINEAR_TEAM_ID = 'lt-1';

function makeIssue(overrides: Partial<LinearIssue> = {}): LinearIssue {
  return {
    id: crypto.randomUUID(),
    identifier: 'PRJ-1',
    title: 'Test issue',
    description: 'Some description',
    stateName: 'In Progress',
    stateType: 'started',
    priority: 2,
    assigneeName: 'Alice',
    labelNames: ['feature'],
    commentCount: 3,
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-02-25'),
    completedAt: null,
    ...overrides,
  };
}

describe('SnapshotLinearProject', () => {
  let service: SnapshotLinearProjectService;
  let projectRepo: ProjectRepositoryInMemory;
  let snapshotRepo: LinearTicketSnapshotRepositoryInMemory;
  let linearGateway: FakeLinearApiGateway;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SnapshotLinearProjectService,
        { provide: ProjectRepository, useClass: ProjectRepositoryInMemory },
        { provide: LinearTicketSnapshotRepository, useClass: LinearTicketSnapshotRepositoryInMemory },
        { provide: LINEAR_API_GATEWAY, useClass: FakeLinearApiGateway },
      ],
    }).compile();

    service = module.get<SnapshotLinearProjectService>(SnapshotLinearProjectService);
    projectRepo = module.get<ProjectRepositoryInMemory>(ProjectRepository);
    snapshotRepo = module.get<LinearTicketSnapshotRepositoryInMemory>(LinearTicketSnapshotRepository);
    linearGateway = module.get<FakeLinearApiGateway>(LINEAR_API_GATEWAY);

    projectRepo.clear();
    snapshotRepo.clear();
    linearGateway.clear();
  });

  describe('when project has no linear project or team id', () => {
    it('should return 0 snapshots', async () => {
      const project = Project.create({ name: 'No Linear', emoji: '🚀', organizationId: ORG_ID });
      await projectRepo.save(project);

      const result = await service.execute(new SnapshotLinearProjectCommand(project.getId(), ORG_ID, LINEAR_TOKEN));

      expect(result).toEqual({ snapshots: 0 });
    });
  });

  describe('when project has linearProjectId', () => {
    it('should fetch issues from gateway and create snapshots', async () => {
      const project = Project.create({ name: 'With Linear', emoji: '🚀', organizationId: ORG_ID });
      project.setLinearProject(LINEAR_PROJECT_ID, LINEAR_TEAM_ID);
      await projectRepo.save(project);

      const issues = [makeIssue({ identifier: 'PRJ-1' }), makeIssue({ identifier: 'PRJ-2' })];
      linearGateway.seedProjectIssues(LINEAR_PROJECT_ID, issues);

      const result = await service.execute(new SnapshotLinearProjectCommand(project.getId(), ORG_ID, LINEAR_TOKEN));

      expect(result.snapshots).toBe(2);

      const stored = await snapshotRepo.findAll();
      expect(stored).toHaveLength(2);
      expect(stored.map((s) => s.getIdentifier()).sort()).toEqual(['PRJ-1', 'PRJ-2']);
    });
  });

  describe('when project has linearTeamId only', () => {
    it('should fetch team issues', async () => {
      const project = Project.create({ name: 'Team Only', emoji: '🚀', organizationId: ORG_ID });
      project.setLinearProject('', LINEAR_TEAM_ID);

      // Clear linearProjectId by setting it to empty, then simulate team-only
      // We need a project with only linearTeamId set. The aggregate's setLinearProject sets both.
      // So we reconstitute one with linearProjectId = null.
      const reconstituted = Project.reconstitute({
        id: project.getId(),
        name: 'Team Only',
        emoji: '🚀',
        organizationId: ORG_ID,
        pmLeadName: null,
        techLeadName: null,
        teamName: null,
        targetDate: null,
        weekNumber: 9,
        slackChannelIds: [],
        linearProjectId: null,
        linearTeamId: LINEAR_TEAM_ID,
        notionPageId: null,
        productObjective: null,
        objectiveOrigin: null,
        keyResults: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      await projectRepo.save(reconstituted);

      const issues = [makeIssue({ identifier: 'TEAM-1' })];
      linearGateway.seedTeamIssues(LINEAR_TEAM_ID, issues);

      const result = await service.execute(
        new SnapshotLinearProjectCommand(reconstituted.getId(), ORG_ID, LINEAR_TOKEN),
      );

      expect(result.snapshots).toBe(1);
      const stored = await snapshotRepo.findAll();
      expect(stored[0].getIdentifier()).toBe('TEAM-1');
    });
  });

  describe('since date resolution', () => {
    it('should use 7 days ago when no previous snapshots exist', async () => {
      const project = Project.create({ name: 'Fresh', emoji: '🚀', organizationId: ORG_ID });
      project.setLinearProject(LINEAR_PROJECT_ID, LINEAR_TEAM_ID);
      await projectRepo.save(project);

      const recentIssue = makeIssue({
        identifier: 'PRJ-RECENT',
        updatedAt: new Date(),
      });
      const oldIssue = makeIssue({
        identifier: 'PRJ-OLD',
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      });
      linearGateway.seedProjectIssues(LINEAR_PROJECT_ID, [recentIssue, oldIssue]);

      const result = await service.execute(new SnapshotLinearProjectCommand(project.getId(), ORG_ID, LINEAR_TOKEN));

      // Only the recent issue should pass the 7-day filter
      expect(result.snapshots).toBe(1);
    });

    it('should use latest snapshot date for incremental sync', async () => {
      const project = Project.create({ name: 'Incremental', emoji: '🚀', organizationId: ORG_ID });
      project.setLinearProject(LINEAR_PROJECT_ID, LINEAR_TEAM_ID);
      await projectRepo.save(project);

      const previousSnapshotDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const existingSnapshot = LinearTicketSnapshot.snapshot({
        organizationId: ORG_ID,
        projectId: project.getId(),
        linearIssueId: 'existing-issue',
        identifier: 'PRJ-OLD',
        title: 'Old',
        description: null,
        stateName: 'Done',
        stateType: 'completed',
        priority: 3,
        assigneeName: null,
        labelNames: [],
        commentCount: 0,
        snapshotDate: previousSnapshotDate,
        snapshotWeekStart: new Date('2026-02-23'),
      });
      await snapshotRepo.save(existingSnapshot);

      const recentIssue = makeIssue({
        identifier: 'PRJ-NEW',
        updatedAt: new Date(),
      });
      const olderIssue = makeIssue({
        identifier: 'PRJ-SKIP',
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      });
      linearGateway.seedProjectIssues(LINEAR_PROJECT_ID, [recentIssue, olderIssue]);

      const result = await service.execute(new SnapshotLinearProjectCommand(project.getId(), ORG_ID, LINEAR_TOKEN));

      // Only the issue updated after the previous snapshot date should be included
      expect(result.snapshots).toBe(1);
      const stored = await snapshotRepo.findAll();
      const identifiers = stored.map((s) => s.getIdentifier());
      expect(identifiers).toContain('PRJ-NEW');
    });
  });

  describe('issue to snapshot mapping', () => {
    it('should correctly map all issue fields to snapshot', async () => {
      const project = Project.create({ name: 'Mapping', emoji: '🚀', organizationId: ORG_ID });
      project.setLinearProject(LINEAR_PROJECT_ID, LINEAR_TEAM_ID);
      await projectRepo.save(project);

      const issue = makeIssue({
        id: 'issue-42',
        identifier: 'MAP-1',
        title: 'Map this',
        description: 'desc',
        stateName: 'In Review',
        stateType: 'started',
        priority: 1,
        assigneeName: 'Bob',
        labelNames: ['urgent', 'frontend'],
        commentCount: 5,
      });
      linearGateway.seedProjectIssues(LINEAR_PROJECT_ID, [issue]);

      await service.execute(new SnapshotLinearProjectCommand(project.getId(), ORG_ID, LINEAR_TOKEN));

      const stored = await snapshotRepo.findAll();
      expect(stored).toHaveLength(1);

      const json = stored[0].toJSON();
      expect(json.organizationId).toBe(ORG_ID);
      expect(json.projectId).toBe(project.getId());
      expect(json.linearIssueId).toBe('issue-42');
      expect(json.identifier).toBe('MAP-1');
      expect(json.title).toBe('Map this');
      expect(json.description).toBe('desc');
      expect(json.stateName).toBe('In Review');
      expect(json.stateType).toBe('started');
      expect(json.priority).toBe(1);
      expect(json.assigneeName).toBe('Bob');
      expect(json.labelNames).toEqual(['urgent', 'frontend']);
      expect(json.commentCount).toBe(5);
    });
  });
});
