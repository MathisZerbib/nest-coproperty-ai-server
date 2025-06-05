import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class GoogleCallbackEntity {
  @ApiProperty({ description: 'Google ID token' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({ description: 'Google user ID' })
  @IsString()
  @IsNotEmpty()
  googleId: string;

  @ApiProperty({ description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'User profile picture URL' })
  @IsString()
  @IsNotEmpty()
  picture: string;
}
