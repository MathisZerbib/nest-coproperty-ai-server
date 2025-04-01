import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../../entity/refresh-token.entity';

@Injectable()
export class TokenCleanupService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  // Run this job every day at midnight
  @Cron('0 0 * * *') // Cron expression: minute, hour, day of month, month, day of week
  async handleCron() {
    console.log('Running cleanup for expired refresh tokens...');
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()), // Delete tokens where expiresAt < current date
    });
    console.log(`Deleted ${result.affected} expired refresh tokens.`);
  }
}
