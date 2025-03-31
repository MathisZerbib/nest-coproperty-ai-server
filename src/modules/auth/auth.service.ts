import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    // Ensure the user exists
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate the JWT payload
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
    // Check if the user already exists
    const existingUser = await this.usersService.findOne(email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the new user
    const newUser: Partial<User> = {
      username,
      email,
      password: hashedPassword,
    };
    const createdUser = await this.usersService.create(newUser);

    // Generate the JWT payload
    const payload = { sub: createdUser.userId, email: createdUser.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
