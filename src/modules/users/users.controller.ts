import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard'; // Import the AuthGuard
import { User } from './user.entity';

@Controller('users')
@UseGuards(AuthGuard) // Apply AuthGuard to all routes in this controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(): Promise<User[]> {
    return await this.usersService.getAllUsers();
  }

  @Get(':username')
  async getUserByUsername(
    @Param('username') username: string,
  ): Promise<User | undefined> {
    return await this.usersService.findByUserName(username);
  }

  @Post()
  createUser(@Body() user: User): Promise<User> {
    return this.usersService.create(user);
  }
}
