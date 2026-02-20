import { RepositoryPort } from 'common/domain/repository-port';
import type { Member } from '@/accounts/domain';

export abstract class MemberRepository extends RepositoryPort<Member> {
  abstract findById(id: string): Promise<Member | null>;
  abstract findByAccountId(accountId: string): Promise<Member[]>;
  abstract findByAccountIdAndSlackUserId(args: { accountId: string; slackUserId: string }): Promise<Member | null>;
  abstract findByUserId(userId: string): Promise<Member[]>;
  abstract findByAccountIdAndUserId(props: { accountId: string; userId: string }): Promise<Member | null>;
  abstract findPendingByUserId(userId: string): Promise<Member[]>;
  abstract findActiveAdminsByAccountId(accountId: string): Promise<Member[]>;
  abstract findManyByIds(ids: string[]): Promise<Member[]>;
  abstract findManyByAccountIdAndSlackUserIds(args: { accountId: string; slackUserIds: string[] }): Promise<Member[]>;
  abstract softDelete(member: Member): Promise<void>;
}
