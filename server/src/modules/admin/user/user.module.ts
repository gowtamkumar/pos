import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserController } from './controllers/user.controller'
import { UserEntity } from './entities/user.entity'
import { UserService } from './services/user.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    MulterModule.register({}),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
