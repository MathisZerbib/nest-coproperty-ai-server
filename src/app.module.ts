import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // Import ScheduleModule
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
// import { RefreshToken } from './entity/refresh-token.entity';
// import { User } from './entity/user.entity';
import { MessagesModule } from './modules/chat/messages.module';
import { DataSource } from 'typeorm';
import { ConversationModule } from './modules/conversation/conversation.module';
import { CoproprieteModule } from './modules/copropriete/copropriete.module';
// import { Chat } from '@entity/chat.entity';

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
    }),
    ScheduleModule.forRoot(), // Enable scheduling delete expired tokens
    AuthModule,
    UsersModule,
    MessagesModule,
    ConversationModule,
    CoproprieteModule,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {
    this.dataSource
      .initialize()
      .then(() => {
        console.log('Database connection established');
      })
      .catch((error) => {
        console.error('Error during Data Source initialization:', error);
      });
  }
}
