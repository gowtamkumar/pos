import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProductEntity } from '../product/entities/product.entity'
import { SaleItemEntity } from '../sale/entities/sale-item.entity'
import { SaleEntity } from '../sale/entities/sale.entity'
import { AiController } from './controllers/ai.controller'
import { AiService } from './services/ai.service'

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity, SaleEntity, SaleItemEntity])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
