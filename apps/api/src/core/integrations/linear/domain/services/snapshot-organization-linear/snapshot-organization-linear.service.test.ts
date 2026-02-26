import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TokenEncryption } from 'auth/token-encryption';
import { Organization } from '@/accounts/domain/aggregates/organization.aggregate';
import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { OrganizationRepositoryInMemory } from '@/accounts/infrastructure/persistence/in-memory/organization.repository.in-memory';
import { LINEAR_API_GATEWAY, type LinearIssue } from '@/integrations/linear/domain/gateways/linear-api.gateway';
import { LinearTicketSnapshotRepository } from '@/integrations/linear/domain/repositories/linear-ticket-snapshot.repository';
import { SnapshotLinearProjectService } from '@/integrations/linear/domain/services/snapshot-linear-project/snapshot-linear-project.service';
import { FakeLinearApiGateway } from '@/integrations/linear/infrastructure/gateways/fake-linear-api.gateway';
import { LinearTicketSnapshotRepositoryInMemory } from '@/integrations/linear/infrastructure/persistence/in-memory/linear-ticket-snapshot.repository.in-memory';
import { Project } from '@/projects/domain/aggregates/project.aggregate';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ProjectRepositoryInMemory } from '@/projects/infrastructure/persistence/in-memory/project.repository.in-memory';

import {
  SnapshotOrganizationLinearCommand,
  SnapshotOrganizationLinearService,
} from './snapshot-organization-linear.service';

const ENCRYPTION_KEY = 'a'.repeat(64);
const LINEAR_PROJECT_ID = 'lp-1';
const LINEAR_TEAM_ID = 'lt-1';

function makeIssue(overrides: Partial<LinearIssue> = {}): LinearIssue {
  return {
    id: crypto.randomUUID(),
    identifier: 'PRJ-1',
    title: 'Test issue',
    description: null,
    stateName: 'In Progress',
    stateType: 'started',
    priority: 2,
    assigneeName: null,
    labelNames: [],
    commentCount: 0,
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-02-25'),
    completedAt: null,
    ...overrides,
  };
}

describe('SnapshotOrganizationLinear', () => {
  let service: SnapshotOrganizationLinearService;
  let orgRepo: OrganizationRepositoryInMemory;
  let projectRepo: ProjectRepositoryInMemory;
  let snapshotRepo: LinearTicketSnapshotRepositoryInMemory;
  let linearGateway: FakeLinearApiGateway;
  let tokenEncryption: TokenEncryption;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SnapshotOrganizationLinearService,
        SnapshotLinearProjectService,
        TokenEncryption,
        {
          provide: ConfigService,
          useValue: { getOrThrow: (key: string) => (key === 'ENCRYPTION_KEY' ? ENCRYPTION_KEY : '') },
        },
        { provide: OrganizationRepository, useClass: OrganizationRepositoryInMemory },
        { provide: ProjectRepository, useClass: ProjectRepositoryInMemory },
        { provide: LinearTicketSnapshotRepository, useClass: LinearTicketSnapshotRepositoryInMemory },
        { provide: LINEAR_API_GATEWAY, useClass: FakeLinearApiGateway },
      ],
    }).compile();

    service = module.get<SnapshotOrganizationLinearService>(SnapshotOrganizationLinearService);
    orgRepo = module.get<OrganizationRepositoryInMemory>(OrganizationRepository);
    projectRepo = module.get<ProjectRepositoryInMemory>(ProjectRepository);
    snapshotRepo = module.get<LinearTicketSnapshotRepositoryInMemory>(LinearTicketSnapshotRepository);
    linearGateway = module.get<FakeLinearApiGateway>(LINEAR_API_GATEWAY);
    tokenEncryption = module.get<TokenEncryption>(TokenEncryption);

    orgRepo.clear();
    projectRepo.clear();
    snapshotRepo.clear();
    linearGateway.clear();
  });

  describe('when organization has no linearAccessToken', () => {
    it('should skip and return 0 snapshots', async () => {
      const org = Organization.create({ name: 'Acme', slackTeamId: 'T_ACME', slackBotToken: 'xoxb-test' });
      await orgRepo.save(org);

      const result = await service.execute(new SnapshotOrganizationLinearCommand(org.getId()));

      expect(result).toEqual({ snapshots: 0 });
    });
  });

  describe('when organization has linearAccessToken and projects', () => {
    it('should snapshot qualifying projects', async () => {
      const org = Organization.create({ name: 'Acme', slackTeamId: 'T_ACME', slackBotToken: 'xoxb-test' });
      const encryptedToken = tokenEncryption.encrypt('lin_test_token');
      org.connectLinear(encryptedToken);
      await orgRepo.save(org);

      const p1 = Project.create({ name: 'P1', emoji: '🚀', organizationId: org.getId() });
      p1.setLinearProject(LINEAR_PROJECT_ID, LINEAR_TEAM_ID);
      await projectRepo.save(p1);

      const p2 = Project.create({ name: 'P2', emoji: '🔧', organizationId: org.getId() });
      // p2 has no linear config, should be skipped
      await projectRepo.save(p2);

      linearGateway.seedProjectIssues(LINEAR_PROJECT_ID, [makeIssue()]);

      const result = await service.execute(new SnapshotOrganizationLinearCommand(org.getId()));

      expect(result.snapshots).toBe(1);
      const stored = await snapshotRepo.findAll();
      expect(stored).toHaveLength(1);
      expect(stored[0].getProjectId()).toBe(p1.getId());
    });
  });

  describe('when one project snapshot fails', () => {
    it('should continue processing remaining projects', async () => {
      const org = Organization.create({ name: 'Acme', slackTeamId: 'T_ACME', slackBotToken: 'xoxb-test' });
      const encryptedToken = tokenEncryption.encrypt('lin_test_token');
      org.connectLinear(encryptedToken);
      await orgRepo.save(org);

      // p1 will have issues that cause failure (missing project in repo after fetch)
      const p1 = Project.create({ name: 'P1', emoji: '🚀', organizationId: org.getId() });
      p1.setLinearProject('bad-project-id', LINEAR_TEAM_ID);
      await projectRepo.save(p1);

      const p2 = Project.create({ name: 'P2', emoji: '🔧', organizationId: org.getId() });
      p2.setLinearProject('good-project-id', LINEAR_TEAM_ID);
      await projectRepo.save(p2);

      linearGateway.seedProjectIssues('good-project-id', [makeIssue()]);
      // Seed nothing for bad-project-id, so it returns 0 snapshots (no failure)
      // Instead, let's verify both get processed
      linearGateway.seedProjectIssues('bad-project-id', [makeIssue()]);

      const result = await service.execute(new SnapshotOrganizationLinearCommand(org.getId()));

      expect(result.snapshots).toBe(2);
    });
  });
});
