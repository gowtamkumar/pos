import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../admin/auth/decorators/current-user.decorator'
import { Roles } from '../../admin/auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../admin/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../admin/auth/guards/roles.guard'
import { UserDto } from '../../admin/user/dtos/user.dto'
import { UserRole } from '../../admin/user/enums/user-role.enum'
import { CheckoutSaleDto, FilterSaleDto } from '../dtos'
import { SaleService } from '../services/sale.service'

@ApiTags('Sales & Checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SaleController {
  private readonly logger = new Logger(SaleController.name)

  constructor(private readonly saleService: SaleService) {}

  @Post('/checkout')
  @Roles(UserRole.Admin, UserRole.Cashier)
  @ApiOperation({
    summary: 'Process cash checkout with stock deduction and change calculation',
    description:
      'Performs atomic inventory decrement, validates tendered amount >= total, calculates change, and generates immutable line-item snapshot receipt.',
  })
  @ApiResponse({ status: 201, description: 'Sale completed successfully with change calculation' })
  async checkout(@Body() checkoutDto: CheckoutSaleDto, @CurrentUser() cashier: UserDto) {
    this.logger.log(`POST /sales/checkout received from ${cashier?.email || cashier?.name}`)
    const sale = await this.saleService.checkout(checkoutDto, cashier)
    return {
      success: true,
      statusCode: 201,
      message: 'Transaction completed successfully',
      data: sale,
    }
  }

  @Get('/')
  @Roles(UserRole.Admin, UserRole.Cashier)
  @ApiOperation({ summary: 'Get paginated sales history with date and cashier filters' })
  @ApiResponse({ status: 200, description: 'Paginated sales list' })
  async getSales(@Query() filterDto: FilterSaleDto) {
    const result = await this.saleService.getSales(filterDto)
    return {
      success: true,
      statusCode: 200,
      message: 'Sales history retrieved successfully',
      data: result,
    }
  }

  @Get('/summary/today')
  @Roles(UserRole.Admin, UserRole.Cashier)
  @ApiOperation({ summary: "Get today's total sales, revenue, and cash breakdown" })
  @ApiResponse({ status: 200, description: "Today's sales financial summary" })
  async getTodaySummary() {
    const summary = await this.saleService.getTodaySummary()
    return {
      success: true,
      statusCode: 200,
      message: "Today's sales summary retrieved",
      data: summary,
    }
  }

  @Get('/invoice/:invoiceNumber')
  @Roles(UserRole.Admin, UserRole.Cashier)
  @ApiOperation({ summary: 'Lookup sale by invoice number for receipt verification' })
  @ApiResponse({ status: 200, description: 'Sale details and line items' })
  async getSaleByInvoice(@Param('invoiceNumber') invoiceNumber: string) {
    const sale = await this.saleService.getSaleByInvoice(invoiceNumber)
    return {
      success: true,
      statusCode: 200,
      message: 'Sale found by invoice number',
      data: sale,
    }
  }

  @Get('/:id')
  @Roles(UserRole.Admin, UserRole.Cashier)
  @ApiOperation({ summary: 'Get complete sale and receipt breakdown by ID' })
  @ApiResponse({ status: 200, description: 'Sale receipt details' })
  async getSaleById(@Param('id', ParseUUIDPipe) id: string) {
    const sale = await this.saleService.getSaleById(id)
    return {
      success: true,
      statusCode: 200,
      message: 'Sale details retrieved successfully',
      data: sale,
    }
  }
}
