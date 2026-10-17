import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import dayjs from 'dayjs'
import { DataSource, In, Repository } from 'typeorm'
import { paginate, PaginatedResult } from '../../../common/helpers/paginate.helper'
import { UserDto } from '../../admin/user/dtos/user.dto'
import { ProductEntity } from '../../product/entities/product.entity'
import { CheckoutSaleDto, FilterSaleDto } from '../dtos'
import { SaleItemEntity } from '../entities/sale-item.entity'
import { SaleEntity, SaleStatus } from '../entities/sale.entity'

export interface DailySalesSummary {
  date: string
  totalRevenue: number
  totalTransactions: number
  totalItemsSold: number
  totalTax: number
  totalDiscount: number
  totalCashTendered: number
  totalChangeGiven: number
}

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name)

  constructor(
    @InjectRepository(SaleEntity)
    private readonly saleRepo: Repository<SaleEntity>,
    @InjectRepository(SaleItemEntity)
    private readonly saleItemRepo: Repository<SaleItemEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private generateInvoiceNumber(): string {
    const rand = Math.floor(1000 + Math.random() * 9000)
    return `INV-${dayjs().format('YYYYMMDD')}-${rand}`
  }

  async checkout(checkoutDto: CheckoutSaleDto, cashier: UserDto): Promise<SaleEntity> {
    this.logger.log(`Checkout by cashier ${cashier.name}`)

    const {
      items,
      amountTendered,
      discount = 0,
      taxRate = 0,
      customerName,
      customerPhone,
      notes,
    } = checkoutDto

    if (!items?.length) {
      throw new BadRequestException('Checkout cart must contain at least one item')
    }

    // Merge duplicate cart entries
    const cartMap = new Map<string, number>()
    for (const item of items) {
      cartMap.set(item.productId, (cartMap.get(item.productId) || 0) + item.quantity)
    }

    return await this.dataSource.transaction(async (manager) => {
      const productIds = Array.from(cartMap.keys())
      const products = await manager.findBy(ProductEntity, { id: In(productIds) })
      const productMap = new Map(products.map((p) => [p.id, p]))

      const saleItems: SaleItemEntity[] = []
      let subtotal = 0

      for (const [productId, quantity] of cartMap.entries()) {
        const product = productMap.get(productId)

        if (!product) {
          throw new NotFoundException(`Product not found with ID '${productId}'`)
        }

        if (!product.isActive) {
          throw new BadRequestException(`Product '${product.name}' is inactive`)
        }

        if (product.stockQuantity < quantity) {
          throw new BadRequestException(
            `Insufficient stock for '${product.name}'. Available: ${product.stockQuantity}, Requested: ${quantity}`,
          )
        }

        product.stockQuantity -= quantity

        const unitPrice = Number(product.retailPrice)
        const lineTotal = Number((unitPrice * quantity).toFixed(2))
        subtotal += lineTotal

        saleItems.push(
          manager.create(SaleItemEntity, {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            unitPrice,
            unitCost: Number(product.costPrice),
            quantity,
            subtotal: lineTotal,
          }),
        )
      }

      const discountAmount = Math.max(0, Number(discount) || 0)
      const taxable = Math.max(0, subtotal - discountAmount)
      const taxAmount = Number(((taxable * (Number(taxRate) || 0)) / 100).toFixed(2))
      const total = Number((taxable + taxAmount).toFixed(2))
      const tendered = Number(amountTendered)

      if (tendered < total) {
        throw new BadRequestException(
          `Amount tendered ($${tendered.toFixed(2)}) is less than total payable ($${total.toFixed(2)})`,
        )
      }

      const changeDue = Number((tendered - total).toFixed(2))

      // Update product stock
      await manager.save(ProductEntity, products)

      // Create sale record
      const sale = manager.create(SaleEntity, {
        invoiceNumber: this.generateInvoiceNumber(),
        userId: cashier.id,
        customerName: customerName?.trim() || 'Walk-in Customer',
        customerPhone: customerPhone?.trim() || null,
        subtotal: Number(subtotal.toFixed(2)),
        discount: discountAmount,
        tax: taxAmount,
        taxRate: Number(taxRate) || 0,
        total,
        amountTendered: tendered,
        changeDue,
        paymentMethod: 'CASH',
        status: SaleStatus.COMPLETED,
        notes: notes?.trim() || null,
      })

      const savedSale = await manager.save(SaleEntity, sale)

      saleItems.forEach((item) => (item.saleId = savedSale.id))

      savedSale.items = await manager.save(SaleItemEntity, saleItems)
      savedSale.user = {
        id: cashier.id,
        name: cashier.name,
        email: cashier.email,
        username: cashier.username,
      } as any

      this.logger.log(
        `Sale ${savedSale.invoiceNumber} completed. Total: $${total}, Change: $${changeDue}`,
      )
      return savedSale
    })
  }

  async getSales(filterDto: FilterSaleDto): Promise<PaginatedResult<SaleEntity>> {
    this.logger.log(`${this.getSales.name} Service Called`)
    const { search, userId, startDate, endDate, page = 1, limit = 20 } = filterDto
    const activePage = Number(page) || 1
    const activeLimit = Number(limit) || 20

    const qb = this.saleRepo
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.user', 'user')
      .leftJoinAndSelect('sale.items', 'items')
      .orderBy('sale.createdAt', 'DESC')

    if (search?.trim()) {
      const s = `%${search.trim()}%`
      qb.andWhere(
        '(sale.invoiceNumber ILIKE :s OR sale.customerName ILIKE :s OR sale.customerPhone ILIKE :s)',
        { s },
      )
    }

    if (userId) {
      qb.andWhere('sale.userId = :userId', { userId })
    }

    if (startDate) {
      qb.andWhere('sale.createdAt >= :startDate', {
        startDate: dayjs(startDate).startOf('day').toDate(),
      })
    }

    if (endDate) {
      qb.andWhere('sale.createdAt <= :endDate', {
        endDate: dayjs(endDate).endOf('day').toDate(),
      })
    }

    const skip = (activePage - 1) * activeLimit
    qb.skip(skip).take(activeLimit)

    const [data, total] = await qb.getManyAndCount()

    return paginate(data, total, activePage, activeLimit)
  }

  async getSaleById(id: string): Promise<SaleEntity> {
    this.logger.log(`${this.getSaleById.name} Service Called for id: ${id}`)
    const sale = await this.saleRepo.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    })

    if (!sale) {
      throw new NotFoundException(`Sale with ID '${id}' not found`)
    }

    return sale
  }

  async getSaleByInvoice(invoiceNumber: string): Promise<SaleEntity> {
    this.logger.log(`${this.getSaleByInvoice.name} Service Called for invoice: ${invoiceNumber}`)
    const sale = await this.saleRepo.findOne({
      where: { invoiceNumber },
      relations: ['user', 'items', 'items.product'],
    })

    if (!sale) {
      throw new NotFoundException(`Sale with Invoice Number '${invoiceNumber}' not found`)
    }

    return sale
  }

  async getTodaySummary(): Promise<DailySalesSummary> {
    this.logger.log(`${this.getTodaySummary.name} Service Called`)

    const startOfDay = dayjs().startOf('day').toDate()
    const endOfDay = dayjs().endOf('day').toDate()

    const sales = await this.saleRepo
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .where('sale.createdAt BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .getMany()

    let totalRevenue = 0
    let totalTax = 0
    let totalDiscount = 0
    let totalCashTendered = 0
    let totalChangeGiven = 0
    let totalItemsSold = 0

    for (const sale of sales) {
      totalRevenue += Number(sale.total)
      totalTax += Number(sale.tax)
      totalDiscount += Number(sale.discount)
      totalCashTendered += Number(sale.amountTendered)
      totalChangeGiven += Number(sale.changeDue)

      if (sale.items) {
        for (const item of sale.items) {
          totalItemsSold += Number(item.quantity)
        }
      }
    }

    return {
      date: dayjs().format('YYYY-MM-DD'),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalTransactions: sales.length,
      totalItemsSold,
      totalTax: Number(totalTax.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      totalCashTendered: Number(totalCashTendered.toFixed(2)),
      totalChangeGiven: Number(totalChangeGiven.toFixed(2)),
    }
  }
}
