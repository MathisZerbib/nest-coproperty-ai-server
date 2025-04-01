import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entity/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../../entity/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersService.findOne(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      email: user.email,
    });
    const refreshToken = await this.generateRefreshToken(user);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async generateRefreshToken(user: User): Promise<string> {
    // Delete existing refresh tokens for the user
    await this.refreshTokenRepository.delete({ user });

    // Generate a new refresh token
    const token = this.jwtService.sign({}, { expiresIn: '7d' }); // Refresh token valid for 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = this.refreshTokenRepository.create({
      token,
      user,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);

    return token;
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: storedToken.user.userId,
      email: storedToken.user.email,
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
    // Check if a user with the same email already exists
    const existingUser = await this.usersService.findOne(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      username,
    });

    // Generate access and refresh tokens
    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      email: user.email,
    });
    const refreshToken = await this.generateRefreshToken(user);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async getUserFromToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify<{ email: string }>(token);
      const user = await this.usersService.findOne(payload.email);
      return user ?? null;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }
}
