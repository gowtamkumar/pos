import { IsEnum, IsOptional, IsString } from 'class-validator'
import { PageQueryDto } from '../../../../common/dtos/page-query.dto'
import { UserRole } from '../enums/user-role.enum'
import { UserStatus } from '../enums/user-status.enum'

export class FilterUserDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  username?: string

  @IsOptional()
  @IsString()
  role?: string

  @IsOptional()
  roles?: UserRole

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus
}
