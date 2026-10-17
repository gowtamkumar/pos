import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator'

export class SaleItemInputDto {
  @ApiProperty({ example: '509989d2-6847-44c2-9011-1d54bead90a1', description: 'Product UUID' })
  @IsUUID('4', { message: 'productId must be a valid UUID' })
  @IsNotEmpty()
  productId: string

  @ApiProperty({ example: 2, description: 'Quantity purchased' })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number
}

export class CheckoutSaleDto {
  @ApiProperty({
    type: [SaleItemInputDto],
    description: 'Cart line items to checkout',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Checkout cart must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemInputDto)
  items: SaleItemInputDto[]

  @ApiProperty({ example: 100.0, description: 'Cash tendered by customer' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0, { message: 'amountTendered cannot be negative' })
  amountTendered: number

  @ApiPropertyOptional({ example: 0.0, description: 'Fixed discount amount applied' })
  @Transform(({ value }) => (value !== undefined ? Number(value) : 0))
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number

  @ApiPropertyOptional({ example: 5.0, description: 'Tax percentage rate (e.g. 5 for 5%)' })
  @Transform(({ value }) => (value !== undefined ? Number(value) : 0))
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number

  @ApiPropertyOptional({ example: 'Walk-in Customer', description: 'Customer name' })
  @IsString()
  @IsOptional()
  customerName?: string

  @ApiPropertyOptional({ example: '+1234567890', description: 'Customer contact phone' })
  @IsString()
  @IsOptional()
  customerPhone?: string

  @ApiPropertyOptional({ example: 'Counter 1 Morning shift sale', description: 'Sale notes' })
  @IsString()
  @IsOptional()
  notes?: string
}
