import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInEntity } from '../../entities/sign-in.entity';
import { SignUpEntity } from '../../entities/sign-up.entity';
import { AuthGuard } from './auth.guard';
import { GoogleCallbackEntity } from '../../entities/google-callback.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sign in a user' })
  @ApiBody({ type: SignInEntity })
  @ApiResponse({ status: 200, description: 'User successfully signed in' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() SignInEntity: SignInEntity) {
    return this.authService.signIn(SignInEntity.email, SignInEntity.password);
  }

  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiBody({ type: SignUpEntity })
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
  @ApiBody({ schema: { example: { refresh_token: 'your-refresh-token' } } })
  @ApiResponse({ status: 200, description: 'Access token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshAccessToken(@Body() refreshDto: { refresh_token: string }) {
    if (!refreshDto.refresh_token) {
      throw new HttpException(
        'Refresh token is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.authService.refreshAccessToken(refreshDto.refresh_token);
  }

  @ApiOperation({ summary: 'Logout a user' })
  @ApiBody({ schema: { example: { refresh_token: 'your-refresh-token' } } })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() logoutDto: { refresh_token: string }) {
    if (!logoutDto.refresh_token) {
      throw new HttpException(
        'Refresh token is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.authService.revokeRefreshToken(logoutDto.refresh_token);
    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Get authenticated user details' })
  @ApiResponse({ status: 200, description: 'Authenticated user details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @Get('me')
  getAuthenticatedUser(@Req() req: { user: { sub: string } }) {
    const userId = req.user.sub;
    return { userId };
  }

  @ApiOperation({ summary: 'Handle Google OAuth authentication' })
  @ApiBody({ type: GoogleCallbackEntity })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated with Google',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Google authentication data',
  })
  @HttpCode(HttpStatus.OK)
  @Post('google')
  async handleGoogleAuth(@Body() googleData: GoogleCallbackEntity) {
    try {
      return await this.authService.handleGoogleCallback(googleData);
    } catch (error) {
      console.error('Google authentication error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Invalid Google authentication data';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({ summary: 'Refresh access token (NextAuth.js compatible)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'The refresh token to use',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Access token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @HttpCode(HttpStatus.OK)
  @Post('token')
  async refreshToken(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new HttpException(
        'Refresh token is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.authService.refreshAccessToken(body.refreshToken);
    return {
      accessToken: result.access_token,
      refreshToken: body.refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }
}
