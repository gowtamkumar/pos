import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class FilterProductDto {
  @ApiPropertyOptional({ description: 'Search term for name, SKU, or barcode' })
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string

  @ApiPropertyOptional({ description: 'Filter by low stock status (stock <= lowStockThreshold)' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true
    if (value === 'false' || value === false) return false
    return undefined
  })
  @IsBoolean()
  @IsOptional()
  isLowStock?: boolean

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true
    if (value === 'false' || value === false) return false
    return undefined
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @Transform(({ value }) => Number(value) || 1)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1

  @ApiPropertyOptional({ default: 20, description: 'Items per page' })
  @Transform(({ value }) => Number(value) || 20)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20
}

