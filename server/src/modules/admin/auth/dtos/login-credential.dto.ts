import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class LoginCredentialDto {
  /**
   * Can be either a username or an email address
   */
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  credential: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  password: string;
}
