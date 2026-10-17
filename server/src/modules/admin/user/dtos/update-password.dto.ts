import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'Admin@1234', description: 'Current password' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecret@2026', description: 'New password (min 6 chars)' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 50)
  newPassword: string;
}
