import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MessagesModule } from './modules/chat/messages.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { CoproprieteModule } from './modules/copropriete/copropriete.module';

@Module({
  imports: [
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
      logging: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    MessagesModule,
    ConversationModule,
    CoproprieteModule,
  ],
})
export class AppModule {}
