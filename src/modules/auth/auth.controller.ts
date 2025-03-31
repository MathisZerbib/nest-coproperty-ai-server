import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: { email: string; password: string }) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshAccessToken(@Body() refreshDto: { refresh_token: string }) {
    return this.authService.refreshAccessToken(refreshDto.refresh_token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() logoutDto: { refresh_token: string }) {
    await this.authService.revokeRefreshToken(logoutDto.refresh_token);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(
    req: Request & { user?: { id: string; username: string; email: string } },
  ) {
    if (!req.user) {
      throw new Error('User not found');
    }
    return {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
    };
  }
}
