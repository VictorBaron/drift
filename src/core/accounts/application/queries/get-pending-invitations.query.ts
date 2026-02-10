import { Injectable } from '@nestjs/common';
import { Member, MemberRepository } from 'src/core/accounts/domain';

export class GetPendingInvitationsQuery {
  constructor(readonly userId: string) {}
}

@Injectable()
export class GetPendingInvitationsHandler {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(query: GetPendingInvitationsQuery): Promise<Member[]> {
    return this.memberRepository.findPendingByUserId(query.userId);
  }
}
