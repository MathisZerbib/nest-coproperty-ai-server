import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { SignInEntity } from '../../entity/sign-in.entity';
import { SignUpEntity } from '../../entity/sign-up.entity';

@ApiTags('Auth') // Group routes under "Auth" in Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sign in a user' })
  @ApiBody({ type: SignInEntity }) // Define the request body schema
  @ApiResponse({ status: 200, description: 'User successfully signed in' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() SignInEntity: SignInEntity) {
    return this.authService.signIn(SignInEntity.email, SignInEntity.password);
  }

  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiBody({ type: SignUpEntity }) // Define the request body schema
  @ApiResponse({ status: 201, description: 'User successfully signed up' })
  @ApiResponse({ status: 400, description: 'Email already exists' })
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signUp(@Body() SignUpEntity: SignUpEntity) {
    return this.authService.signUp(
      SignUpEntity.email,
      SignUpEntity.password,
      SignUpEntity.username,
    );
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ schema: { example: { refresh_token: 'your-refresh-token' } } }) // Example for request body
  @ApiResponse({ status: 200, description: 'Access token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshAccessToken(@Body() refreshDto: { refresh_token: string }) {
    return this.authService.refreshAccessToken(refreshDto.refresh_token);
  }

  @ApiOperation({ summary: 'Logout a user' })
  @ApiBody({ schema: { example: { refresh_token: 'your-refresh-token' } } })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() logoutDto: { refresh_token: string }) {
    await this.authService.revokeRefreshToken(logoutDto.refresh_token);
    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth() // Requires JWT Bearer token
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
