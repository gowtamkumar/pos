import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { UserEntity } from '../../admin/user/entities/user.entity'
import { SaleItemEntity } from './sale-item.entity'

export enum SaleStatus {
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  VOIDED = 'VOIDED',
}

@Entity('sales')
@Index('idx_sales_invoice_number', ['invoiceNumber'], { unique: true })
@Index('idx_sales_created_at', ['createdAt'])
@Index('idx_sales_user_id', ['userId'])
export class SaleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => UserEntity, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ name: 'customer_name', default: 'Walk-in Customer' })
  customerName: string

  @Column({ name: 'customer_phone', type: 'varchar', nullable: true })
  customerPhone: string | null

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  subtotal: number

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  tax: number

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  taxRate: number

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  discount: number

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  total: number

  @Column({ name: 'amount_tendered', type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  amountTendered: number

  @Column({ name: 'change_due', type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  changeDue: number

  @Column({ name: 'payment_method', default: 'CASH' })
  paymentMethod: string

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @OneToMany(() => SaleItemEntity, (item) => item.sale, { cascade: true })
  items: SaleItemEntity[]

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date
}

