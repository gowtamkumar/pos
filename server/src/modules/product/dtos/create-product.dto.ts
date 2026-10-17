import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator'

export class CreateProductDto {
  @ApiProperty({ example: 'Coca-Cola 500ml', description: 'Product title' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: '7a35e406-8c43-4318-8f83-e022f4682c35', description: 'Category UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  categoryId: string

  @ApiPropertyOptional({ example: 'BEV-COCA-500', description: 'Unique Stock Keeping Unit (auto-generated if omitted)' })
  @IsString()
  @IsOptional()
  sku?: string

  @ApiPropertyOptional({ example: '8901234567890', description: 'Unique barcode (auto-generated if omitted)' })
  @IsString()
  @IsOptional()
  barcode?: string

  @ApiProperty({ example: 45.0, description: 'Selling price at checkout' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  retailPrice: number

  @ApiPropertyOptional({ example: 35.0, description: 'Cost price for profit calculation' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : 0))
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number

  @ApiPropertyOptional({ example: 100, default: 0, description: 'Initial stock units' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : 0))
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number

  @ApiPropertyOptional({ example: 10, default: 5, description: 'Low stock trigger alert threshold' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : 5))
  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-coca-cola.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string

  @ApiPropertyOptional({ example: true, default: true })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

