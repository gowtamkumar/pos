import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProductEntity } from '../product/entities/product.entity'
import { SaleController } from './controllers/sale.controller'
import { SaleItemEntity } from './entities/sale-item.entity'
import { SaleEntity } from './entities/sale.entity'
import { SaleService } from './services/sale.service'

@Module({
  imports: [TypeOrmModule.forFeature([SaleEntity, SaleItemEntity, ProductEntity])],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
