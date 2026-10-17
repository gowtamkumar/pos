import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Coca-Cola 500ml Can' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ example: '7a35e406-8c43-4318-8f83-e022f4682c35' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string

  @ApiPropertyOptional({ example: 'BEV-COCA-500-CAN' })
  @IsString()
  @IsOptional()
  sku?: string

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsString()
  @IsOptional()
  barcode?: string

  @ApiPropertyOptional({ example: 50.0 })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  @IsOptional()
  retailPrice?: number

  @ApiPropertyOptional({ example: 38.0 })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number

  @ApiPropertyOptional({ example: 120 })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number

  @ApiPropertyOptional({ example: 15 })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-coca-cola.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
