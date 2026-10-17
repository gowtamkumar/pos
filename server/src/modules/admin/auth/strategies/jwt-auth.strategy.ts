import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UserDto } from '../../user/dtos/user.dto'
import { UserService } from '../../user/services/user.service'
import { AccessTokenPayload } from '../dtos'

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          let token = null
          if (req && req.cookies) {
            token = req.cookies['accessToken']
          }
          return token
        },
      ]),
      secretOrKey: configService.get('JWT_SECRET_KEY') || 'myUnsecureJwtSecret',
      ignoreExpiration: false,
    })
  }

  async validate(payload: AccessTokenPayload): Promise<UserDto> {
    const { sub: userId } = payload
    const user = await this.userService.getUser(userId)
    if (!user) {
      throw new UnauthorizedException('Token not valid')
    }
    return user
  }
}
