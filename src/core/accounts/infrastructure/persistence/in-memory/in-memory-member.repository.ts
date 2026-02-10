import { Member, MemberRepository } from 'src/core/accounts/domain';

export class InMemoryMemberRepository extends MemberRepository {
  private members: Map<string, Member> = new Map();

  async findById(id: string): Promise<Member | null> {
    return Promise.resolve(this.members.get(id) ?? null);
  }

  async findByAccountId(accountId: string): Promise<Member[]> {
    return Promise.resolve(
      Array.from(this.members.values()).filter(
        (m) => m.getAccountId() === accountId,
      ),
    );
  }

  async findByUserId(userId: string): Promise<Member[]> {
    return Promise.resolve(
      Array.from(this.members.values()).filter((m) => m.getUserId() === userId),
    );
  }

  async findByAccountIdAndUserId(props: {
    accountId: string;
    userId: string;
  }): Promise<Member | null> {
    return Promise.resolve(
      Array.from(this.members.values()).find(
        (m) =>
          m.getAccountId() === props.accountId &&
          m.getUserId() === props.userId,
      ) ?? null,
    );
  }

  async findPendingByUserId(userId: string): Promise<Member[]> {
    return Promise.resolve(
      Array.from(this.members.values()).filter(
        (m) => m.getUserId() === userId && m.isPending(),
      ),
    );
  }

  async findActiveAdminsByAccountId(accountId: string): Promise<Member[]> {
    return Promise.resolve(
      Array.from(this.members.values()).filter(
        (m) => m.getAccountId() === accountId && m.isAdmin() && m.isActive(),
      ),
    );
  }

  async save(member: Member): Promise<void> {
    this.members.set(member.id, member);
    return Promise.resolve();
  }

  async softDelete(member: Member): Promise<void> {
    this.members.delete(member.id);
    return Promise.resolve();
  }

  clear(): void {
    this.members.clear();
  }
}
