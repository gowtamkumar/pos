import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { UserModule } from '../user/user.module'
import { AuthController } from './controllers/auth.controller'
import { RolesGuard } from './guards/roles.guard'
import { AuthService } from './services/auth.service'
import { JwtAuthStrategy } from './strategies/jwt-auth.strategy'

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const expires = configService.get('JWT_EXPIRES')
        const parsedExpires = expires && !isNaN(Number(expires)) ? Number(expires) : expires || '1h'
        return {
          secret: configService.get('JWT_SECRET_KEY'),
          signOptions: { expiresIn: parsedExpires },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthStrategy, RolesGuard],
  exports: [RolesGuard],
})
export class AuthModule {}
