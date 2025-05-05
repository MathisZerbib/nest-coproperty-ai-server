import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '@entity/user.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt properly - this is critical for the tests to pass
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: User = {
    userId: '123',
    email: 'test@example.com',
    password: 'Password123!',
    username: 'testuser',
    phone: '1234567890',
    address: '123 Test Street',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date(),
    refreshTokens: [],
    coproprietes: [],
  };

  const mockUsersService = {
    findOne: jest.fn().mockResolvedValue(mockUser as User | undefined),
    create: jest.fn().mockResolvedValue(mockUser),
    findById: jest.fn().mockResolvedValue(mockUser),
    getAllUsers: jest.fn().mockResolvedValue([mockUser] as User[]),
    update: jest.fn().mockResolvedValue(mockUser),
    changePassword: jest.fn().mockResolvedValue(mockUser),
    findOneBy: jest.fn().mockResolvedValue(mockUser as User | undefined),
    comparePasswords: jest.fn().mockResolvedValue(true as boolean),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mockToken'),
    sign: jest.fn().mockReturnValue('mockToken'),
  };

  const mockRefreshTokenRepository = {
    delete: jest.fn().mockResolvedValue(undefined),
    findOne: jest.fn().mockResolvedValue(undefined),
    save: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(
      (tokenData: Partial<RefreshToken>) => tokenData as RefreshToken,
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access and refresh tokens if credentials are valid', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      // Set the bcrypt.compare mock to return true explicitly
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.signIn('test@example.com', 'Password123!');

      expect(mockUsersService.findOne).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'Password123!',
        mockUser.password,
      );
      expect(result).toEqual({
        access_token: 'mockToken',
        refresh_token: 'mockToken',
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue(undefined);

      await expect(
        service.signIn('test@example.com', 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signIn('test@example.com', 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signUp', () => {
    it('should create a new user and return tokens', async () => {
      mockUsersService.findOne.mockResolvedValue(undefined);
      // Mock the hash function correctly
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.signUp(
        'test@example.com',
        'Password123!',
        'testuser',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'Password123!',
        expect.any(Number),
      );
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashedPassword', // This should be the hashed password
        username: 'testuser',
      });
      expect(result).toEqual({
        access_token: 'mockToken',
        refresh_token: 'mockToken',
      });
    });

    it('should throw UnauthorizedException if email already exists', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(
        service.signUp('test@example.com', 'password', 'testuser'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshAccessToken', () => {
    it('should return a new access token if refresh token is valid', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        token: 'mockRefreshToken',
        user: mockUser,
        expiresAt: new Date(Date.now() + 10000),
      });

      const result = await service.refreshAccessToken('mockRefreshToken');

      expect(result).toEqual({ access_token: 'mockToken' });
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue(undefined);

      await expect(service.refreshAccessToken('invalidToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        token: 'mockRefreshToken',
        user: mockUser,
        expiresAt: new Date(Date.now() - 10000),
      });

      await expect(
        service.refreshAccessToken('mockRefreshToken'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should delete the refresh token', async () => {
      await service.revokeRefreshToken('mockRefreshToken');

      expect(mockRefreshTokenRepository.delete).toHaveBeenCalledWith({
        token: 'mockRefreshToken',
      });
    });
  });
});
