import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator'

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Beverages & Soft Drinks' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Length(2, 50)
  name?: string

  @ApiPropertyOptional({ example: 'beverages-soft-drinks' })
  @IsString()
  @IsOptional()
  slug?: string

  @ApiPropertyOptional({ example: 'Updated description for beverages' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
