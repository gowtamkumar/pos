import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { paginate, PaginatedResult } from '../../../common/helpers/paginate.helper'
import { CreateCategoryDto, FilterCategoryDto, UpdateCategoryDto } from '../dtos'
import { CategoryEntity } from '../entities/category.entity'

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name)

  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async getCategories(filterDto: FilterCategoryDto): Promise<PaginatedResult<CategoryEntity>> {
    this.logger.log(`${this.getCategories.name} Service Called`)
    const { search, isActive, page = 1, limit = 20 } = filterDto
    const activePage = Number(page) || 1
    const activeLimit = Number(limit) || 20

    const qb = this.categoryRepo
      .createQueryBuilder('category')
      .orderBy('category.createdAt', 'DESC')

    if (search?.trim()) {
      const s = `%${search.trim()}%`
      qb.andWhere('(category.name ILIKE :s OR category.description ILIKE :s)', { s })
    }

    if (typeof isActive === 'boolean') {
      qb.andWhere('category.isActive = :isActive', { isActive })
    }

    const skip = (activePage - 1) * activeLimit
    qb.skip(skip).take(activeLimit)

    const [data, total] = await qb.getManyAndCount()

    return paginate(data, total, activePage, activeLimit)
  }

  async getAllActiveCategories(): Promise<CategoryEntity[]> {
    this.logger.log(`${this.getAllActiveCategories.name} Service Called`)
    return this.categoryRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    })
  }

  async getCategoryById(id: string): Promise<CategoryEntity> {
    this.logger.log(`${this.getCategoryById.name} Service Called for id: ${id}`)
    const category = await this.categoryRepo.findOne({ where: { id } })
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`)
    }
    return category
  }

  async getCategoryBySlug(slug: string): Promise<CategoryEntity> {
    this.logger.log(`${this.getCategoryBySlug.name} Service Called for slug: ${slug}`)
    const category = await this.categoryRepo.findOne({ where: { slug } })
    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`)
    }
    return category
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    this.logger.log(`${this.createCategory.name} Service Called for: ${createCategoryDto.name}`)

    const slug = createCategoryDto.slug?.trim()
      ? this.slugify(createCategoryDto.slug)
      : this.slugify(createCategoryDto.name)

    // Check duplicate name
    const existingName = await this.categoryRepo.findOne({
      where: { name: createCategoryDto.name.trim() },
    })
    if (existingName) {
      throw new ConflictException(`Category name '${createCategoryDto.name}' already exists`)
    }

    // Check duplicate slug
    const existingSlug = await this.categoryRepo.findOne({ where: { slug } })
    if (existingSlug) {
      throw new ConflictException(`Category slug '${slug}' already exists`)
    }

    const category = this.categoryRepo.create({
      ...createCategoryDto,
      name: createCategoryDto.name.trim(),
      slug,
      isActive: createCategoryDto.isActive !== undefined ? createCategoryDto.isActive : true,
    })

    return this.categoryRepo.save(category)
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryEntity> {
    this.logger.log(`${this.updateCategory.name} Service Called for id: ${id}`)

    const category = await this.getCategoryById(id)

    // Check duplicate name if name is changed
    if (updateCategoryDto.name && updateCategoryDto.name.trim() !== category.name) {
      const existingName = await this.categoryRepo.findOne({
        where: { name: updateCategoryDto.name.trim() },
      })
      if (existingName && existingName.id !== id) {
        throw new ConflictException(`Category name '${updateCategoryDto.name}' already exists`)
      }
    }

    // Generate or check slug
    let slug = category.slug
    if (updateCategoryDto.slug) {
      slug = this.slugify(updateCategoryDto.slug)
    } else if (updateCategoryDto.name && updateCategoryDto.name.trim() !== category.name) {
      slug = this.slugify(updateCategoryDto.name)
    }

    if (slug !== category.slug) {
      const existingSlug = await this.categoryRepo.findOne({ where: { slug } })
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException(`Category slug '${slug}' already exists`)
      }
    }

    this.categoryRepo.merge(category, {
      ...updateCategoryDto,
      name: updateCategoryDto.name ? updateCategoryDto.name.trim() : category.name,
      slug,
    })

    return this.categoryRepo.save(category)
  }

  async deleteCategory(id: string): Promise<CategoryEntity> {
    this.logger.log(`${this.deleteCategory.name} Service Called for id: ${id}`)
    const category = await this.getCategoryById(id)
    return this.categoryRepo.remove(category)
  }
}
