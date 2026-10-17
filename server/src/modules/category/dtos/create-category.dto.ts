import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator'

export class CreateCategoryDto {
  @ApiProperty({ example: 'Beverages', description: 'Unique category name' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string

  @ApiPropertyOptional({
    example: 'beverages',
    description: 'URL slug (auto-generated if omitted)',
  })
  @IsString()
  @IsOptional()
  slug?: string

  @ApiPropertyOptional({
    example: 'Cold drinks, juices, and sodas',
    description: 'Optional description',
  })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Whether the category is active',
  })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
