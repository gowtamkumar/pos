import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AuthStrategy } from '../enum/auth-strategy.enum'

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard(AuthStrategy.JwtAuth) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context)
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    // Gracefully return null when token is missing, expired, or invalid
    if (err || !user) {
      return null as any
    }
    return user
  }
}
