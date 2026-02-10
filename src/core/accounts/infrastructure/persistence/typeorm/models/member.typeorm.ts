import { PersistenceEntity } from 'src/common/persistence-entity';
import { MemberRoleLevel } from 'src/core/accounts/domain';
import { UserTypeOrm } from 'src/core/users/infrastructure/persistence/typeorm/models/user.typeorm';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { AccountTypeOrm } from './account.typeorm';

@Entity('member')
@Unique(['accountId', 'userId'])
@Index('idx_member_accountId', ['accountId'])
@Index('idx_member_userId', ['userId'])
export class MemberTypeOrm extends PersistenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  role: MemberRoleLevel;

  @Column({ type: 'timestamptz', nullable: true })
  invitedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  disabledAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  invitedById: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastActiveAt: Date | null;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => AccountTypeOrm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account?: AccountTypeOrm;

  @ManyToOne(() => UserTypeOrm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: UserTypeOrm;

  @ManyToOne(() => UserTypeOrm, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invitedById' })
  invitedBy?: UserTypeOrm;

  static build(props: Partial<MemberTypeOrm>): MemberTypeOrm {
    return Object.assign<MemberTypeOrm, Partial<MemberTypeOrm>>(
      new MemberTypeOrm(),
      props,
    );
  }
}
