import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { CategoryEntity } from '../../category/entities/category.entity'

@Entity('products')
@Index('idx_products_name', ['name'])
@Index('idx_products_barcode', ['barcode'])
@Index('idx_products_sku', ['sku'])
@Index('idx_products_category', ['categoryId'])
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null

  @ManyToOne(() => CategoryEntity, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity | null

  @Column()
  name: string

  @Column({ unique: true })
  sku: string

  @Column({ unique: true })
  barcode: string

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  retailPrice: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  costPrice: number

  @Column({ type: 'int', default: 0 })
  stockQuantity: number

  @Column({ type: 'int', default: 5 })
  lowStockThreshold: number

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date
}
