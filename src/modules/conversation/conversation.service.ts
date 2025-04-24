// filepath: /Users/zer/Documents/lab/perso/copoperty-ai-server-nest/src/modules/conversation/conversation.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../entities/conversation.entity';
import { Messages } from '../../entities/messages.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Messages)
    private readonly messagesRepository: Repository<Messages>,
  ) {}

  async findAll(): Promise<Conversation[]> {
    return this.conversationRepository.find();
  }

  async create(conversationData: Partial<Conversation>): Promise<Conversation> {
    // Create the conversation
    const conversation = this.conversationRepository.create(conversationData);
    const savedConversation =
      await this.conversationRepository.save(conversation);

    // Create the first bot message
    const botMessage = this.messagesRepository.create({
      conversation: savedConversation, // Associate the conversation
      content: "Bonjour, comment puis-je vous aider aujourd'hui ?",
      role: 'assistant',
      userId: conversationData.userId, // Assuming userId is part of conversationData
      sequence_number: 1,
    });
    await this.messagesRepository.save(botMessage);

    // Return the saved conversation (messages will be loaded via relations if needed)
    return savedConversation;
  }

  async getRecentConversations(): Promise<Conversation[]> {
    return this.conversationRepository.find({
      order: { updated_at: 'DESC' },
      take: 10,
    });
  }
  async getAllConversationsByUserId(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      order: { updated_at: 'DESC' },
    });
  }

  async updateConversation(
    id: string,
    updates: Partial<Conversation>,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    Object.assign(conversation, updates);
    return this.conversationRepository.save(conversation);
  }
  async deleteConversation(id: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    await this.conversationRepository.remove(conversation);
    return conversation;
  }
  async getConversationById(id: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['messages'],
    });
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    return conversation;
  }
}
