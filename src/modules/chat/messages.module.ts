import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Messages } from '@entity/messages.entity';
import { ConversationModule } from '../conversation/conversation.module'; // Import ConversationModule
import { PineconeService } from '../pinecone/pinecone.service';

@Module({
  imports: [TypeOrmModule.forFeature([Messages]), ConversationModule],
  controllers: [MessagesController],
  providers: [MessagesService, PineconeService],
})
export class MessagesModule {}
