import { RepositoryPort } from 'src/common/domain/repository-port';
import { Member } from 'src/core/accounts/domain';

export abstract class MemberRepository extends RepositoryPort<Member> {
  abstract findById(id: string): Promise<Member | null>;
  abstract findByAccountId(accountId: string): Promise<Member[]>;
  abstract findByUserId(userId: string): Promise<Member[]>;
  abstract findByAccountIdAndUserId(props: {
    accountId: string;
    userId: string;
  }): Promise<Member | null>;
  abstract findPendingByUserId(userId: string): Promise<Member[]>;
  abstract findActiveAdminsByAccountId(accountId: string): Promise<Member[]>;
  abstract save(member: Member): Promise<void>;
  abstract softDelete(member: Member): Promise<void>;
}
