import { RepositoryInMemory } from 'common/domain/repository.in-memory';

import { Member, MemberRepository } from '@/accounts/domain';

export class MemberRepositoryInMemory extends RepositoryInMemory<Member> implements MemberRepository {
  async findById(id: string): Promise<Member | null> {
    return this.find((m) => m.getId() === id);
  }

  async findByAccountId(accountId: string): Promise<Member[]> {
    return this.filter((m) => m.getAccountId() === accountId);
  }

  async findByUserId(userId: string): Promise<Member[]> {
    return this.filter((m) => m.getUserId() === userId);
  }

  async findByAccountIdAndSlackUserId({
    accountId,
    slackUserId,
  }: {
    accountId: string;
    slackUserId: string;
  }): Promise<Member | null> {
    return this.find((m) => m.identify({ accountId, slackUserId }));
  }

  async findByAccountIdAndUserId(props: { accountId: string; userId: string }): Promise<Member | null> {
    return this.find((m) => m.getAccountId() === props.accountId && m.getUserId() === props.userId);
  }

  async findPendingByUserId(userId: string): Promise<Member[]> {
    return this.filter((m) => m.getUserId() === userId && m.isPending());
  }

  async findActiveAdminsByAccountId(accountId: string): Promise<Member[]> {
    return this.filter((m) => m.getAccountId() === accountId && m.isAdmin() && m.isActive());
  }

  async findManyByIds(ids: string[]): Promise<Member[]> {
    return this.filter((m) => ids.includes(m.getId()));
  }

  async findManyByAccountIdAndSlackUserIds({
    accountId,
    slackUserIds,
  }: {
    accountId: string;
    slackUserIds: string[];
  }): Promise<Member[]> {
    return this.filter((m) => slackUserIds.some((slackUserId) => m.identify({ accountId, slackUserId })));
  }
}
