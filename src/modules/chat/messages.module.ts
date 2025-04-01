import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Messages } from '@entity/messages.entity';
import { ConversationModule } from '../conversation/conversation.module'; // Import ConversationModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Messages]),
    ConversationModule, // Import ConversationModule to provide ConversationRepository
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
