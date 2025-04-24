import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../../entities/refresh-token.entity';

@Injectable()
export class TokenCleanupService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  @Cron('0 0 * * *')
  async handleCron() {
    console.log('Running cleanup for expired refresh tokens...');
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    console.log(`Deleted ${result.affected} expired refresh tokens.`);
  }
}
