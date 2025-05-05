import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
    refreshAccessToken: jest.fn(),
    revokeRefreshToken: jest.fn(() => {}),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true), // Mock the AuthGuard to always allow access
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard) // Override the AuthGuard with the mock
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should sign in a user', async () => {
    const mockSignInDto = { email: 'test@example.com', password: 'password' };
    const mockToken = { accessToken: 'mockAccessToken' };

    mockAuthService.signIn.mockResolvedValue(mockToken);

    const result = await controller.signIn(mockSignInDto);
    expect(mockAuthService.signIn).toHaveBeenCalledWith(
      mockSignInDto.email,
      mockSignInDto.password,
    );
    expect(result).toEqual(mockToken);
  });

  it('should sign up a user', async () => {
    const mockSignUpDto = {
      email: 'test@example.com',
      password: 'password',
      username: 'testuser',
    };
    const mockUser = { id: '123', ...mockSignUpDto };

    mockAuthService.signUp.mockResolvedValue(mockUser);

    const result = await controller.signUp(mockSignUpDto);

    expect(mockAuthService.signUp).toHaveBeenCalledWith(
      mockSignUpDto.email,
      mockSignUpDto.password,
      mockSignUpDto.username,
    );
    expect(result).toEqual(mockUser);
  });

  it('should refresh access token', async () => {
    const mockRefreshDto = { refresh_token: 'mockRefreshToken' };
    const mockToken = { accessToken: 'newAccessToken' };

    mockAuthService.refreshAccessToken.mockResolvedValue(mockToken);

    const result = await controller.refreshAccessToken(mockRefreshDto);

    expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith(
      mockRefreshDto.refresh_token,
    );
    expect(result).toEqual(mockToken);
  });

  it('should get authenticated user details', () => {
    const mockRequest = { user: { sub: '123' } };
    const result = controller.getAuthenticatedUser(mockRequest);

    expect(result).toEqual({ userId: '123' });
  });
});
