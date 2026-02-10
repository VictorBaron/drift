import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'src/common/domain';
import {
  Member,
  MemberRepository,
  MemberRoleLevel,
} from 'src/core/accounts/domain';
import { Repository as TypeOrmRepository, SelectQueryBuilder } from 'typeorm';

import { MemberMapper } from './mappers';
import { MemberTypeOrm } from './models/member.typeorm';

@Injectable()
export class MemberRepositoryTypeOrm
  extends Repository<Member, MemberTypeOrm>
  implements MemberRepository
{
  constructor(
    @InjectRepository(MemberTypeOrm)
    protected readonly memberRepository: TypeOrmRepository<MemberTypeOrm>,
    eventBus: EventBus,
  ) {
    super(memberRepository, eventBus, MemberMapper);
  }

  private createQueryBuilder(): SelectQueryBuilder<MemberTypeOrm> {
    return this.memberRepository.createQueryBuilder('member');
  }

  async findById(id: string): Promise<Member | null> {
    const entity = await this.createQueryBuilder()
      .where('member.id = :id', { id })
      .getOne();

    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findByAccountId(accountId: string): Promise<Member[]> {
    const members = await this.createQueryBuilder()
      .where('member.accountId = :accountId', { accountId })
      .orderBy('member.createdAt', 'ASC')
      .getMany();

    return members.map((member) => MemberMapper.toDomain(member));
  }

  async findByUserId(userId: string): Promise<Member[]> {
    const members = await this.createQueryBuilder()
      .where('member.userId = :userId', { userId })
      .orderBy('member.createdAt', 'ASC')
      .getMany();

    return members.map((member) => MemberMapper.toDomain(member));
  }

  async findByAccountIdAndUserId(props: {
    accountId: string;
    userId: string;
  }): Promise<Member | null> {
    const entity = await this.createQueryBuilder()
      .where('member.accountId = :accountId', { accountId: props.accountId })
      .andWhere('member.userId = :userId', { userId: props.userId })
      .getOne();

    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findPendingByUserId(userId: string): Promise<Member[]> {
    const members = await this.createQueryBuilder()
      .where('member.userId = :userId', { userId })
      .andWhere('member.activatedAt IS NULL')
      .andWhere('member.disabledAt IS NULL')
      .orderBy('member.invitedAt', 'DESC')
      .getMany();

    return members.map((member) => MemberMapper.toDomain(member));
  }

  async findActiveAdminsByAccountId(accountId: string): Promise<Member[]> {
    const members = await this.createQueryBuilder()
      .where('member.accountId = :accountId', { accountId })
      .andWhere('member.role = :role', { role: MemberRoleLevel.ADMIN })
      .andWhere('member.activatedAt IS NOT NULL')
      .andWhere('member.disabledAt IS NULL')
      .getMany();

    return members.map((member) => MemberMapper.toDomain(member));
  }
}
