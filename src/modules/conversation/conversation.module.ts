import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../../entities/conversation.entity';
import { Messages } from '../../entities/messages.entity'; // Import Messages entity
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Messages])], // Add Messages here
  providers: [ConversationService],
  controllers: [ConversationController],
  exports: [ConversationService, TypeOrmModule], // Export ConversationService and TypeOrmModule
})
export class ConversationModule {}
