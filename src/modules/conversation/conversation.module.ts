import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../../entity/conversation.entity';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation])],
  providers: [ConversationService],
  controllers: [ConversationController],
  exports: [ConversationService, TypeOrmModule], // Export ConversationService and TypeOrmModule
})
export class ConversationModule {}
