import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { GoogleCallbackEntity } from '../../entities/google-callback.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  private async logTokenDetails(
    token: string,
    type: 'access' | 'refresh',
  ): Promise<void> {
    try {
      const decoded = await this.jwtService.verifyAsync<JwtPayload>(token);
      this.logger.debug(
        `[Token Debug] ${type.toUpperCase()} Token Details:
        - Token: ${token}
        - Decoded: ${JSON.stringify(decoded, null, 2)}
        - Expires: ${new Date(decoded.exp * 1000).toISOString()}
        - Issued At: ${new Date(decoded.iat * 1000).toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `[Token Debug] Failed to decode ${type} token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    this.logger.debug(
      `[Credential Auth] Attempting sign in for email: ${email}`,
    );
    const user = await this.usersService.findOne(email);
    if (!user) {
      this.logger.warn(`[Credential Auth] User not found for email: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(
        `[Credential Auth] Invalid password for user: ${user.userId}`,
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.debug(
      `[Credential Auth] Successfully authenticated user: ${user.userId}`,
    );
    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      email: user.email,
      role: user.role,
    });
    await this.logTokenDetails(accessToken, 'access');

    const refreshToken = await this.generateRefreshToken(user, 'credential');
    await this.logTokenDetails(refreshToken, 'refresh');

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async generateRefreshToken(
    user: User,
    authMethod: 'credential' | 'google',
  ): Promise<string> {
    try {
      this.logger.debug(
        `[${authMethod} Auth] Generating refresh token for user: ${user.userId}`,
      );

      // Get existing refresh tokens before deletion
      const existingTokens = await this.refreshTokenRepository.find({
        where: { user },
        relations: ['user'],
      });

      if (existingTokens.length > 0) {
        this.logger.debug(
          `[${authMethod} Auth] Found ${existingTokens.length} existing refresh tokens for user: ${user.userId}`,
        );
        for (const token of existingTokens) {
          this.logger.debug(
            `[${authMethod} Auth] Old refresh token: ${token.token} (expires: ${token.expiresAt.toISOString()})`,
          );
          await this.logTokenDetails(token.token, 'refresh');
        }
      }

      // Delete any existing refresh tokens for this user
      await this.refreshTokenRepository.delete({ user });
      this.logger.debug(
        `[${authMethod} Auth] Deleted existing refresh tokens for user: ${user.userId}`,
      );

      // Generate new refresh token
      const token = this.jwtService.sign({}, { expiresIn: '7d' });
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create and save the refresh token
      const refreshToken = this.refreshTokenRepository.create({
        token,
        user,
        expiresAt,
      });
      await this.refreshTokenRepository.save(refreshToken);
      this.logger.debug(
        `[${authMethod} Auth] Created new refresh token: ${token} (expires: ${expiresAt.toISOString()})`,
      );
      await this.logTokenDetails(token, 'refresh');

      return token;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `[${authMethod} Auth] Error generating refresh token: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      console.log('Invalid or expired refresh token', storedToken);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: storedToken.user.userId,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    return { access_token: accessToken };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token: refreshToken });
  }

  async signUp(
    email: string,
    password: string,
    username: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const existingUser = await this.usersService.findOne(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      username,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await this.generateRefreshToken(user, 'credential');

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async handleGoogleCallback(
    googleData: GoogleCallbackEntity,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      this.logger.debug(
        `[Google Auth] Processing Google callback for email: ${googleData.email}`,
      );
      let user = await this.usersService.findOne(googleData.email);
      this.logger.debug(
        `[Google Auth] Found user: ${user ? user.userId : 'not found'}`,
      );

      if (!user) {
        this.logger.debug(
          `[Google Auth] Creating new user for Google account: ${googleData.email}`,
        );
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await this.usersService.create({
          email: googleData.email,
          password: hashedPassword,
          username: googleData.name,
          googleId: googleData.googleId,
          profilePicture: googleData.picture,
        });
        this.logger.debug(
          `[Google Auth] Created new user with ID: ${user.userId}`,
        );
      } else if (!user.googleId) {
        this.logger.debug(
          `[Google Auth] Linking existing user ${user.userId} with Google ID`,
        );
        const updatedUser = {
          ...user,
          googleId: googleData.googleId,
          profilePicture: googleData.picture,
        };
        user = await this.usersService.update(user.userId, updatedUser);
        this.logger.debug(
          `[Google Auth] Updated existing user with Google ID: ${user.userId}`,
        );
      }

      const accessToken = await this.jwtService.signAsync({
        sub: user.userId,
        email: user.email,
        role: user.role,
      });
      await this.logTokenDetails(accessToken, 'access');
      this.logger.debug(
        `[Google Auth] Generated access token for user: ${user.userId}`,
      );

      const refreshToken = await this.generateRefreshToken(user, 'google');
      await this.logTokenDetails(refreshToken, 'refresh');
      this.logger.debug(
        `[Google Auth] Generated and stored refresh token for user: ${user.userId}`,
      );

      const storedToken = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
        relations: ['user'],
      });

      if (!storedToken) {
        this.logger.error(
          `[Google Auth] Failed to store refresh token for user: ${user.userId}`,
        );
        throw new Error('Failed to store refresh token');
      }

      this.logger.debug(
        `[Google Auth] Successfully authenticated user: ${user.userId} with Google`,
      );
      return { access_token: accessToken, refresh_token: refreshToken };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `[Google Auth] Error in handleGoogleCallback: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
