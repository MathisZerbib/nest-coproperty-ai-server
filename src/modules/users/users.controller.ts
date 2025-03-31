import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService, User } from './users.service';
import { AuthGuard } from '../auth/auth.guard'; // Import the AuthGuard

@Controller('users')
@UseGuards(AuthGuard) // Apply AuthGuard to all routes in this controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllUsers(): User[] {
    return this.usersService.getAllUsers();
  }

  @Get(':username')
  getUserByUsername(@Param('username') username: string): User | undefined {
    return this.usersService.findOne(username);
  }

  @Post()
  createUser(@Body() user: User): User {
    return this.usersService.create(user);
  }
}
