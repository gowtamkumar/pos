import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../admin/auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../admin/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../admin/auth/guards/roles.guard'
import { UserRole } from '../../admin/user/enums/user-role.enum'
import { CreateCategoryDto, FilterCategoryDto, UpdateCategoryDto } from '../dtos'
import { CategoryService } from '../services/category.service'

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name)

  constructor(private readonly categoryService: CategoryService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get paginated categories with search and status filter' })
  @ApiResponse({ status: 200, description: 'Paginated list of categories' })
  async getCategories(@Query() filterDto: FilterCategoryDto) {
    const result = await this.categoryService.getCategories(filterDto)
    return {
      success: true,
      statusCode: 200,
      message: 'Categories retrieved successfully',
      data: result,
    }
  }

  @Get('/active')
  @ApiOperation({ summary: 'Get all active categories for POS terminal quick selection' })
  @ApiResponse({ status: 200, description: 'List of all active categories' })
  async getActiveCategories() {
    const categories = await this.categoryService.getAllActiveCategories()
    return {
      success: true,
      statusCode: 200,
      message: 'Active categories retrieved',
      data: categories,
    }
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category details' })
  async getCategory(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categoryService.getCategoryById(id)
    return {
      success: true,
      statusCode: 200,
      message: 'Category retrieved successfully',
      data: category,
    }
  }

  @Post('/')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoryService.createCategory(createCategoryDto)
    return {
      success: true,
      statusCode: 201,
      message: 'Category created successfully',
      data: category,
    }
  }

  @Put('/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoryService.updateCategory(id, updateCategoryDto)
    return {
      success: true,
      statusCode: 200,
      message: 'Category updated successfully',
      data: category,
    }
  }

  @Delete('/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categoryService.deleteCategory(id)
    return {
      success: true,
      statusCode: 200,
      message: 'Category deleted successfully',
      data: category,
    }
  }
}
