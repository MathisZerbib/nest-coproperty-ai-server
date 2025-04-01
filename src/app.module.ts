import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // Import ScheduleModule
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RefreshToken } from './modules/auth/refresh-token.entity';
import { User } from './modules/users/dto/user.dto';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'zer',
      password: process.env.DB_PASSWORD,
      database: 'copoperty_ai',
      entities: [User, RefreshToken],
      synchronize: true,
    }),
    ScheduleModule.forRoot(), // Enable scheduling
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
