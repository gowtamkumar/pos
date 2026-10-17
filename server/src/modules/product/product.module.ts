import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CategoryEntity } from '../category/entities/category.entity'
import { ProductController } from './controllers/product.controller'
import { ProductEntity } from './entities/product.entity'
import { ProductService } from './services/product.service'

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity, CategoryEntity])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService, TypeOrmModule],
})
export class ProductModule {}

