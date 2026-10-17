import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { AdjustStockDto, CreateProductDto, FilterProductDto, UpdateProductDto } from '../dtos'
import { ProductService } from '../services/product.service'

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name)

  constructor(private readonly productService: ProductService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get paginated products with search, category, and low stock filters' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  async getProducts(@Query() filterDto: FilterProductDto) {
    const result = await this.productService.getProducts(filterDto)
    return {
      success: true,
      statusCode: 200,
      message: 'Products retrieved successfully',
      data: result,
    }
  }

  @Get('/low-stock')
  @ApiOperation({ summary: 'Get all low-stock items for terminal alerts and AI restock advice' })
  @ApiResponse({ status: 200, description: 'List of low stock products' })
  async getLowStockProducts() {
    const products = await this.productService.getLowStockProducts()
    return {
      success: true,
      statusCode: 200,
      message: 'Low stock products retrieved',
      data: products,
    }
  }

  @Get('/barcode/:barcode')
  @ApiOperation({ summary: 'Instant product lookup by barcode for USB/Bluetooth scanner' })
  @ApiResponse({ status: 200, description: 'Product matched by barcode' })
  async getProductByBarcode(@Param('barcode') barcode: string) {
    const product = await this.productService.getProductByBarcode(barcode)
    return { success: true, statusCode: 200, message: 'Product found by barcode', data: product }
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  async getProduct(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productService.getProductById(id)
    return {
      success: true,
      statusCode: 200,
      message: 'Product retrieved successfully',
      data: product,
    }
  }

  @Post('/')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a new product with SKU, barcode, and pricing (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    const product = await this.productService.createProduct(createProductDto)
    return {
      success: true,
      statusCode: 201,
      message: 'Product created successfully',
      data: product,
    }
  }

  @Put('/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update product information and pricing (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productService.updateProduct(id, updateProductDto)
    return {
      success: true,
      statusCode: 200,
      message: 'Product updated successfully',
      data: product,
    }
  }

  @Patch('/:id/stock')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Restock or adjust product inventory quantity (Admin only)' })
  @ApiResponse({ status: 200, description: 'Stock quantity adjusted' })
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() adjustStockDto: AdjustStockDto,
  ) {
    const product = await this.productService.adjustStock(id, adjustStockDto)
    return {
      success: true,
      statusCode: 200,
      message: 'Product stock adjusted successfully',
      data: product,
    }
  }

  @Delete('/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productService.deleteProduct(id)
    return {
      success: true,
      statusCode: 200,
      message: 'Product deleted successfully',
      data: product,
    }
  }
}
