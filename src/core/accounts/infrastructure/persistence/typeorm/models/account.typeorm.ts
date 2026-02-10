import {
  OwnProperties,
  PersistenceEntity,
} from 'src/common/persistence-entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('account')
export class AccountTypeOrm extends PersistenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  static build(props: OwnProperties<AccountTypeOrm>): AccountTypeOrm {
    return Object.assign<AccountTypeOrm, OwnProperties<AccountTypeOrm>>(
      new AccountTypeOrm(),
      props,
    );
  }
}
