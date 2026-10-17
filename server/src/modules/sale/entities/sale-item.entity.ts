import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ProductEntity } from '../../product/entities/product.entity'
import { SaleEntity } from './sale.entity'

@Entity('sale_items')
@Index('idx_sale_items_sale_id', ['saleId'])
@Index('idx_sale_items_product_id', ['productId'])
export class SaleItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'sale_id', type: 'uuid' })
  saleId: string

  @ManyToOne(() => SaleEntity, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: SaleEntity

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null

  @ManyToOne(() => ProductEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity | null

  // Immutable snapshots taken at the exact moment of checkout
  @Column({ name: 'product_name' })
  productName: string

  @Column({ name: 'product_sku' })
  productSku: string

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  unitCost: number

  @Column({ type: 'int', default: 1 })
  quantity: number

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
