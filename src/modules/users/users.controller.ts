import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../../entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  async findById(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users', type: [User] })
  @Get()
  async getAllUsers(): Promise<User[]> {
    return await this.usersService.getAllUsers();
  }

  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({ status: 200, description: 'User details', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':email')
  async getUserByEmail(@Param('email') email: string): Promise<User> {
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @ApiOperation({ summary: 'Update user details' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() user: Partial<User>,
  ): Promise<User | undefined> {
    const existingUser = await this.usersService.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    return await this.usersService.update(id, { ...existingUser, ...user });
  }

  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Post(':id/password')
  async updatePassword(
    @Param('id') id: string,
    @Body('password') password: string,
    @Body('oldPassword') oldPassword: string,
  ): Promise<User | undefined> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.usersService.changePassword(
      user.userId,
      oldPassword,
      password,
    );
  }

  // Uncomment this if you want to create a new user

  // @ApiOperation({ summary: 'Create a new user' })
  // @ApiResponse({
  //   status: 201,
  //   description: 'User successfully created',
  //   type: User,
  // })
  // @ApiResponse({ status: 400, description: 'Invalid input' })
  // @Post()
  // createUser(@Body() user: User): Promise<User> {
  //   return this.usersService.create(user);
  // }
}
