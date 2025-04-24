import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { CoproprieteModule } from './modules/copropriete/copropriete.module';
import { UploadModule } from './modules/upload/upload.module';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'zer',
      password: process.env.DB_PASSWORD,
      database: 'copoperty_ai',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: ['src/migrations/*.ts'],
      synchronize: true,
      // logging: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    MessagesModule,
    ConversationModule,
    CoproprieteModule,
    UploadModule,
    FilesModule,
  ],
})
export class AppModule {}
