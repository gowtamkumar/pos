import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

export enum StockAdjustmentType {
  ADD = 'ADD',
  SET = 'SET',
  DEDUCT = 'DEDUCT',
}

export class AdjustStockDto {
  @ApiProperty({ enum: StockAdjustmentType, example: StockAdjustmentType.ADD })
  @IsEnum(StockAdjustmentType)
  @IsNotEmpty()
  type: StockAdjustmentType

  @ApiProperty({ example: 25, description: 'Quantity to add, set, or deduct' })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  quantity: number

  @ApiPropertyOptional({ example: 'Supplier stock replenishment', description: 'Reason for adjustment' })
  @IsString()
  @IsOptional()
  reason?: string
}

