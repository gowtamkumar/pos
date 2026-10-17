import { Transform } from 'class-transformer'
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class FilterSaleDto {
  @IsString()
  @IsOptional()
  search?: string

  @IsUUID('4')
  @IsOptional()
  userId?: string

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1

  @Transform(({ value }) => (value ? Number(value) : 20))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20
}
