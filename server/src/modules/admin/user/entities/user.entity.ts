import {
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { UserRole } from '../enums/user-role.enum'
import { UserStatus } from '../enums/user-status.enum'

@Entity('users')
@Index('idx_users_email', ['email'])
@Index('idx_users_username', ['username'])
@Index('idx_users_status', ['status'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true, nullable: true })
  email: string

  @Column({ unique: true })
  username: string

  @Column({ nullable: true })
  password?: string

  @Column({ default: false })
  isAdmin: boolean

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.Cashier],
  })
  roles: UserRole[]

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.Active })
  status: UserStatus

  @Column({ type: 'text', nullable: true })
  avatarUrl: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date

  @AfterInsert()
  logInsert() {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Inserted User of id: ${this.id}`)
    }
  }

  @AfterUpdate()
  logUpdate() {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Updated User of id: ${this.id}`)
    }
  }

  @AfterRemove()
  logRemove() {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`User Removed`)
    }
  }
}
