import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CookieOptions, Request, Response } from 'express'
import { UserDto } from '../../user/dtos/user.dto'
import { CurrentUser } from '../decorators/current-user.decorator'
import { LoginCredentialDto, RegisterCredentialDto } from '../dtos'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { AuthService } from '../services/auth.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('/register')
  async register(
    @Body() registerCredentialDto: RegisterCredentialDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authPayload = await this.authService.register(registerCredentialDto)
    this.cookiesBuildTokenResponsive(res, authPayload.token)
    return {
      success: true,
      statusCode: 200,
      message: 'Registration successfull',
      data: authPayload,
    }
  }

  @Post('/login')
  async login(
    @Body() loginCredentialDto: LoginCredentialDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authPayload = await this.authService.login(loginCredentialDto)
    this.cookiesBuildTokenResponsive(res, authPayload.token)
    return { success: true, statusCode: 200, message: 'Login successfull', data: authPayload }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    Object.entries(req.cookies).forEach(([key]) => res.clearCookie(key))
    return { success: true, statusCode: 200, message: 'Logout successfull', data: null }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  getMe(@CurrentUser() user: UserDto) {
    return this.authService.getMe(user)
  }

  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Body('refreshToken') bodyRefreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    let rawToken = bodyRefreshToken
    if (!rawToken && req.headers?.authorization) {
      const parts = req.headers.authorization.split(' ')
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        rawToken = parts[1]
      }
    }
    if (!rawToken && req.cookies) {
      rawToken = req.cookies.refreshToken || req.cookies.accessToken
    }

    if (!rawToken) {
      throw new UnauthorizedException('No token provided for refresh')
    }

    const data = await this.authService.refreshToken(rawToken)
    this.cookiesBuildTokenResponsive(res, data.accessToken)
    return {
      success: true,
      statusCode: 200,
      message: 'Token refreshed successfully',
      accessToken: data.accessToken,
      data,
    }
  }

  private cookiesBuildTokenResponsive(response: Response, token: string) {
    const isProduction = process.env.NODE_ENV === 'production'
    const cookiesOptions: CookieOptions = {
      httpOnly: true,
      sameSite: isProduction ? 'strict' : 'lax',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      path: '/',
    }
    return response.status(200).cookie('accessToken', token, cookiesOptions)
  }
}
