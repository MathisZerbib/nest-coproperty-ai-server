import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  // Use jest.Mock instead of direct method references to avoid unbound method lint errors
  let findOneMock: jest.Mock;
  let findMock: jest.Mock;
  let createMock: jest.Mock;
  let saveMock: jest.Mock;
  let findOneByMock: jest.Mock;

  const mockUser: User = {
    userId: '123',
    email: 'test@example.com',
    password: 'hashedpassword',
    refreshTokens: [],
    username: 'testuser',
    phone: '1234567890',
    address: '123 Test Street',
    role: 'user',
    created_at: new Date(),
    updated_at: new Date(),
    coproprietes: [],
  };

  beforeEach(async () => {
    findOneMock = jest.fn();
    findMock = jest.fn();
    createMock = jest.fn();
    saveMock = jest.fn();
    findOneByMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: findOneMock,
            find: findMock,
            create: createMock,
            save: saveMock,
            findOneBy: findOneByMock,
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a user by email', async () => {
    findOneMock.mockResolvedValueOnce(mockUser);
    const result = await service.findOne('test@example.com');
    expect(result).toEqual(mockUser);
    expect(findOneMock).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      relations: { refreshTokens: true },
    });
  });

  it('should create a user', async () => {
    const partialUser = { email: 'test@example.com' };
    createMock.mockReturnValueOnce(partialUser);
    saveMock.mockResolvedValueOnce(mockUser);

    const result = await service.create(partialUser);
    expect(result).toEqual(mockUser);
    expect(createMock).toHaveBeenCalledWith(partialUser);
    expect(saveMock).toHaveBeenCalledWith(partialUser);
  });

  it('should return all users', async () => {
    findMock.mockResolvedValueOnce([mockUser]);
    const result = await service.getAllUsers();
    expect(result).toEqual([mockUser]);
  });

  it('should find a user by ID', async () => {
    findOneMock.mockResolvedValueOnce(mockUser);
    const result = await service.findById('123');
    expect(result).toEqual(mockUser);
    expect(findOneMock).toHaveBeenCalledWith({
      where: { userId: '123' },
      relations: ['refreshTokens'],
    });
  });

  it('should update a user', async () => {
    saveMock.mockResolvedValueOnce(mockUser);
    const result = await service.update(mockUser);
    expect(result).toEqual(mockUser);
  });

  it('should change password when old password is valid', async () => {
    const bcrypt = await import('bcrypt');
    const newPassword = 'newPass';
    const hashedNewPassword = 'hashedNewPass';

    findOneByMock.mockResolvedValueOnce(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValueOnce(
      hashedNewPassword,
    );
    saveMock.mockResolvedValueOnce({
      ...mockUser,
      password: hashedNewPassword,
    });

    const result = await service.changePassword('123', 'oldPass', newPassword);
    expect(result?.password).toEqual(hashedNewPassword);
  });

  it('should return undefined if user not found during password change', async () => {
    findOneByMock.mockResolvedValueOnce(undefined);
    const result = await service.changePassword('bad-id', 'old', 'new');
    expect(result).toBeUndefined();
  });

  it('should return undefined if old password is invalid', async () => {
    const bcrypt = await import('bcrypt');

    findOneByMock.mockResolvedValueOnce(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    const result = await service.changePassword('123', 'wrongOld', 'new');
    expect(result).toBeUndefined();
  });
});
