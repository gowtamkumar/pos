import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { AdminModule } from './modules/admin/admin.module'
import { CategoryModule } from './modules/category/category.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.development', '.env'],
    }),
    DatabaseModule,
    AdminModule,
    CategoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
