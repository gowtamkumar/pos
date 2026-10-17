import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { paginate, PaginatedResult } from '../../../common/helpers/paginate.helper'
import { CategoryEntity } from '../../category/entities/category.entity'
import {
  AdjustStockDto,
  CreateProductDto,
  FilterProductDto,
  StockAdjustmentType,
  UpdateProductDto,
} from '../dtos'
import { ProductEntity } from '../entities/product.entity'

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name)

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
  ) {}

  private generateSku(name: string): string {
    const prefix = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase()
    const rand = Math.floor(1000 + Math.random() * 9000)
    return `SKU-${prefix}-${rand}`
  }

  private generateBarcode(): string {
    // Generate a 12-digit standard UPC/EAN format starting with 890
    const rand = Math.floor(10000000 + Math.random() * 90000000)
    return `890${rand}`
  }

  async getProducts(filterDto: FilterProductDto): Promise<PaginatedResult<ProductEntity>> {
    this.logger.log(`${this.getProducts.name} Service Called`)
    const { search, categoryId, isLowStock, isActive, page = 1, limit = 20 } = filterDto
    const activePage = Number(page) || 1
    const activeLimit = Number(limit) || 20

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.createdAt', 'DESC')

    if (search?.trim()) {
      const s = `%${search.trim()}%`
      qb.andWhere('(product.name ILIKE :s OR product.sku ILIKE :s OR product.barcode ILIKE :s)', {
        s,
      })
    }

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId })
    }

    if (typeof isLowStock === 'boolean' && isLowStock) {
      qb.andWhere('product.stockQuantity <= product.lowStockThreshold')
    }

    if (typeof isActive === 'boolean') {
      qb.andWhere('product.isActive = :isActive', { isActive })
    }

    const skip = (activePage - 1) * activeLimit
    qb.skip(skip).take(activeLimit)

    const [data, total] = await qb.getManyAndCount()

    return paginate(data, total, activePage, activeLimit)
  }

  async getProductById(id: string): Promise<ProductEntity> {
    this.logger.log(`${this.getProductById.name} Service Called for id: ${id}`)
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['category'],
    })
    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`)
    }
    return product
  }

  async getProductByBarcode(barcode: string): Promise<ProductEntity> {
    this.logger.log(`${this.getProductByBarcode.name} Service Called for barcode: ${barcode}`)
    const product = await this.productRepo.findOne({
      where: { barcode: barcode.trim() },
      relations: ['category'],
    })
    if (!product) {
      throw new NotFoundException(`Product with barcode '${barcode}' not found`)
    }
    return product
  }

  async getLowStockProducts(): Promise<ProductEntity[]> {
    this.logger.log(`${this.getLowStockProducts.name} Service Called`)
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.stockQuantity <= product.lowStockThreshold')
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('product.stockQuantity', 'ASC')
      .getMany()
  }

  async createProduct(createProductDto: CreateProductDto): Promise<ProductEntity> {
    this.logger.log(`${this.createProduct.name} Service Called for: ${createProductDto.name}`)

    // Validate category exists
    const category = await this.categoryRepo.findOne({
      where: { id: createProductDto.categoryId },
    })
    if (!category) {
      throw new NotFoundException(`Category with ID '${createProductDto.categoryId}' not found`)
    }

    const sku = createProductDto.sku?.trim() || this.generateSku(createProductDto.name)
    const barcode = createProductDto.barcode?.trim() || this.generateBarcode()

    // Check duplicate SKU
    const existingSku = await this.productRepo.findOne({ where: { sku } })
    if (existingSku) {
      throw new ConflictException(`Product with SKU '${sku}' already exists`)
    }

    // Check duplicate barcode
    const existingBarcode = await this.productRepo.findOne({ where: { barcode } })
    if (existingBarcode) {
      throw new ConflictException(`Product with barcode '${barcode}' already exists`)
    }

    const product = this.productRepo.create({
      ...createProductDto,
      sku,
      barcode,
      category,
      retailPrice: Number(createProductDto.retailPrice),
      costPrice: Number(createProductDto.costPrice || 0),
      stockQuantity: Number(createProductDto.stockQuantity || 0),
      lowStockThreshold: Number(createProductDto.lowStockThreshold || 5),
      isActive: createProductDto.isActive !== undefined ? createProductDto.isActive : true,
    })

    return this.productRepo.save(product)
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
    this.logger.log(`${this.updateProduct.name} Service Called for id: ${id}`)

    const product = await this.getProductById(id)

    // Check category if updated
    if (updateProductDto.categoryId && updateProductDto.categoryId !== product.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: updateProductDto.categoryId },
      })
      if (!category) {
        throw new NotFoundException(`Category with ID '${updateProductDto.categoryId}' not found`)
      }
      product.category = category
      product.categoryId = category.id
    }

    // Check duplicate SKU if updated
    if (updateProductDto.sku && updateProductDto.sku.trim() !== product.sku) {
      const existingSku = await this.productRepo.findOne({
        where: { sku: updateProductDto.sku.trim() },
      })
      if (existingSku && existingSku.id !== id) {
        throw new ConflictException(`Product with SKU '${updateProductDto.sku}' already exists`)
      }
    }

    // Check duplicate barcode if updated
    if (updateProductDto.barcode && updateProductDto.barcode.trim() !== product.barcode) {
      const existingBarcode = await this.productRepo.findOne({
        where: { barcode: updateProductDto.barcode.trim() },
      })
      if (existingBarcode && existingBarcode.id !== id) {
        throw new ConflictException(
          `Product with barcode '${updateProductDto.barcode}' already exists`,
        )
      }
    }

    this.productRepo.merge(product, {
      ...updateProductDto,
      retailPrice:
        updateProductDto.retailPrice !== undefined
          ? Number(updateProductDto.retailPrice)
          : product.retailPrice,
      costPrice:
        updateProductDto.costPrice !== undefined
          ? Number(updateProductDto.costPrice)
          : product.costPrice,
      stockQuantity:
        updateProductDto.stockQuantity !== undefined
          ? Number(updateProductDto.stockQuantity)
          : product.stockQuantity,
      lowStockThreshold:
        updateProductDto.lowStockThreshold !== undefined
          ? Number(updateProductDto.lowStockThreshold)
          : product.lowStockThreshold,
    })

    return this.productRepo.save(product)
  }

  async adjustStock(id: string, adjustDto: AdjustStockDto): Promise<ProductEntity> {
    this.logger.log(
      `${this.adjustStock.name} Service Called for product ${id}: ${adjustDto.type} ${adjustDto.quantity}`,
    )

    const product = await this.getProductById(id)
    const qty = Number(adjustDto.quantity)

    switch (adjustDto.type) {
      case StockAdjustmentType.ADD:
        product.stockQuantity += qty
        break
      case StockAdjustmentType.SET:
        product.stockQuantity = qty
        break
      case StockAdjustmentType.DEDUCT:
        if (product.stockQuantity < qty) {
          throw new BadRequestException(
            `Cannot deduct ${qty} units. Current stock is only ${product.stockQuantity}.`,
          )
        }
        product.stockQuantity -= qty
        break
    }

    return this.productRepo.save(product)
  }

  async deleteProduct(id: string): Promise<ProductEntity> {
    this.logger.log(`${this.deleteProduct.name} Service Called for id: ${id}`)
    const product = await this.getProductById(id)
    return this.productRepo.remove(product)
  }
}
