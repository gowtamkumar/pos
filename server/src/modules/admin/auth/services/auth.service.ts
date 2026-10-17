import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService, JwtSignOptions } from '@nestjs/jwt'
import { CreateUserDto } from '../../user/dtos/create-user.dto'
import { UserDto } from '../../user/dtos/user.dto'
import { UserRole } from '../../user/enums/user-role.enum'
import { UserService } from '../../user/services/user.service'
import { LoginCredentialDto, RegisterCredentialDto } from '../dtos'

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name)
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerCredentialDto: RegisterCredentialDto) {
    this.logger.log(`${this.register.name} Service Called`)

    const { username } = registerCredentialDto
    const find = await this.userService.findUserByUsername(username)

    if (find) {
      throw new ConflictException('Username already exist')
    }
    const user = await this.userService.createUser({
      ...registerCredentialDto,
      roles: [UserRole.Cashier],
      isAdmin: false,
    } as CreateUserDto)
    const token = this.generatedSignedJwt(user)

    this.logger.log(`User registered: ${user.email || user.username}`)

    return { token, user }
  }

  async login(loginCredentialsDto: LoginCredentialDto) {
    this.logger.log(`${this.login.name} Service Called`)

    const { credential, password } = loginCredentialsDto

    // Lookup by username OR email — supports all roles
    const user = await this.userService.findByCredential(credential)

    const valid = user ? await this.userService.validateUser(user, password) : false

    if (!valid) {
      throw new UnauthorizedException('Invalid Login Credentials')
    }

    const token = this.generatedSignedJwt(user)

    // Strip password hash before returning
    const { password: _pw, ...safeUser } = user as any

    return {
      user: safeUser,
      token,
    }
  }

  async getMe(user: UserDto) {
    this.logger.log(`${this.getMe.name} Service Called`)
    const { password: _pw, ...safeUser } = user as any
    return safeUser
  }

  async refreshToken(rawToken: string) {
    this.logger.log(`${this.refreshToken.name} Service Called`)
    const jwtSecret =
      this.configService.get('JWT_SECRET_KEY') || 'myUnsecureJwtSecret'

    let payload: any
    try {
      payload = this.jwtService.verify(rawToken, { secret: jwtSecret })
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        try {
          payload = this.jwtService.verify(rawToken, {
            secret: jwtSecret,
            ignoreExpiration: true,
          })
        } catch {
          throw new UnauthorizedException('Invalid token signature')
        }
      } else {
        throw new UnauthorizedException('Invalid token')
      }
    }

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload')
    }

    const user = await this.userService.getUser(payload.sub)
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const accessToken = this.generatedSignedJwt(user)
    const { password: _pw, ...safeUser } = user as any

    return {
      accessToken,
      user: safeUser,
    }
  }

  private generatedSignedJwt(user) {
    const jwtSecret =
      this.configService.get('JWT_SECRET_KEY') || 'myUnsecureJwtSecret'

    const jwtSignOptions: JwtSignOptions = {
      subject: user.id,
      secret: jwtSecret,
      expiresIn: '7d',
    }
    return this.jwtService.sign({}, jwtSignOptions)
  }
}
