import { RepositoryPort } from 'common/domain';

import type { Organization } from '../aggregates/organization.aggregate';

export abstract class OrganizationRepository extends RepositoryPort<Organization> {
  abstract findAll(): Promise<Organization[]>;
  abstract findById(id: string): Promise<Organization | null>;
  abstract findBySlackTeamId(slackTeamId: string): Promise<Organization | null>;
}
