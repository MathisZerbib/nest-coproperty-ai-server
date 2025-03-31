import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    const user = this.usersService.findByEmail(email);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.userId, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
  async signUp(
    email: string,
    username: string,
    password: string,
  ): Promise<{ access_token: string }> {
    // Check if user exists
    const existingUser = this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const salt = 10;
    // Hash password
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserData = {
      username,
      email,
      password: hashedPassword,
    };
    // Create user
    const newUser = this.usersService.create({
      userId: Date.now(),
      ...newUserData,
    });

    // Generate token
    const payload = {
      username: newUser.username,
      email: newUser.email,
    };

    this.usersService.sendVerificationEmail(newUser.email);

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
