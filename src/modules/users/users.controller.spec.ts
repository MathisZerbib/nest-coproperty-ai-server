import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../auth/auth.guard';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findById: jest.fn(),
    getAllUsers: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changePassword: jest.fn(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) }) // Mock AuthGuard
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const mockUser = { userId: '1', email: 'test@example.com' };
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findById('1');
      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValue(undefined);

      await expect(controller.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllUsers', () => {
    it('should return a list of users', async () => {
      const mockUsers = [{ userId: '1', email: 'test@example.com' }];
      mockUsersService.getAllUsers.mockResolvedValue(mockUsers);

      const result = await controller.getAllUsers();
      expect(result).toEqual(mockUsers);
      expect(mockUsersService.getAllUsers).toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = { userId: '1', email: 'test@example.com' };
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getUserByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue(undefined);

      await expect(
        controller.getUserByEmail('test@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      const mockUser = { userId: '1', email: 'test@example.com' };
      const updatedUser = { ...mockUser, username: 'updatedUser' };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateUser('1', {
        username: 'updatedUser',
      });
      expect(result).toEqual(updatedUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
      expect(mockUsersService.update).toHaveBeenCalledWith({
        ...mockUser,
        username: 'updatedUser',
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValue(undefined);

      await expect(
        controller.updateUser('1', { username: 'updatedUser' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    it('should update the user password', async () => {
      const mockUser = { userId: '1', email: 'test@example.com' };
      const updatedUser = { ...mockUser, password: 'newPassword' };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.changePassword.mockResolvedValue(updatedUser);

      const result = await controller.updatePassword(
        '1',
        'newPassword',
        'oldPassword',
      );
      expect(result).toEqual(updatedUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
      expect(mockUsersService.changePassword).toHaveBeenCalledWith(
        '1',
        'oldPassword',
        'newPassword',
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValue(undefined);

      await expect(
        controller.updatePassword('1', 'newPassword', 'oldPassword'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
