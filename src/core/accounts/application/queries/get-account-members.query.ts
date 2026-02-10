import { Injectable } from '@nestjs/common';
import { Member, MemberRepository } from 'src/core/accounts/domain';

export class GetAccountMembersQuery {
  constructor(
    readonly props: {
      accountId: string;
      actor: Member;
    },
  ) {}
}

@Injectable()
export class GetAccountMembersHandler {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(query: GetAccountMembersQuery): Promise<Member[]> {
    const members = await this.memberRepository.findByAccountId(
      query.props.accountId,
    );

    return members;
  }
}
