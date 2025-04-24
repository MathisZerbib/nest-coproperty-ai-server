import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { TokenCleanupService } from './token-cleanup.service'; // Import the service

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '15m' }, // Access token valid for 15 minutes
    }),
    TypeOrmModule.forFeature([RefreshToken]),
  ],
  providers: [AuthService, TokenCleanupService], // Register the service
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
