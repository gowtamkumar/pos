import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { Roles } from '../../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { CreateUserDto } from '../dtos/create-user.dto'
import { FilterUserDto } from '../dtos/filter-user.dto'
import { UpdatePasswordDto } from '../dtos/update-password.dto'
import { UpdateUserDto } from '../dtos/update-user.dto'
import { UserDto } from '../dtos/user.dto'
import { UserRole } from '../enums/user-role.enum'
import { UserService } from '../services/user.service'

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name)

  constructor(private readonly userService: UserService) {}

  @Get('/')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'List all users with pagination and search (Admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async getUsers(@Query() filterUserDto: FilterUserDto) {
    const users = await this.userService.getUsers(filterUserDto)
    return { success: true, statusCode: 200, message: 'List of users', data: users }
  }

  @Get('/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userService.getUser(id)
    return { success: true, statusCode: 200, message: `User of ID: ${id}`, data: user }
  }

  @Post('/')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a new user/cashier account (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto)
    return { success: true, statusCode: 201, message: 'New user created successfully', data: user }
  }

  @Put('/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update user details and roles (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.updateUser(id, updateUserDto)
    return { success: true, statusCode: 200, message: `User updated successfully`, data: user }
  }

  @Patch('/update-password/:id')
  @ApiOperation({ summary: 'Update password for a user' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async updatePassword(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const user = await this.userService.updatePassword(userId, updatePasswordDto)
    return {
      success: true,
      statusCode: 200,
      message: `Password updated successfully`,
      data: user,
    }
  }

  @Delete('/:id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete user account (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: UserDto,
  ) {
    const user = await this.userService.deleteUser(userId, currentUser?.id)
    return { success: true, statusCode: 200, message: `User deleted successfully`, data: user }
  }
}
