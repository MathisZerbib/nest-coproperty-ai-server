import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  password: string;
}
