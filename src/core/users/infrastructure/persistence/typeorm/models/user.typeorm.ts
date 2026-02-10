import { PersistenceEntity } from 'src/common/persistence-entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user')
export class UserTypeOrm extends PersistenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  googleId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  static build(props: Partial<UserTypeOrm>): UserTypeOrm {
    return Object.assign<UserTypeOrm, Partial<UserTypeOrm>>(
      new UserTypeOrm(),
      props,
    );
  }
}
