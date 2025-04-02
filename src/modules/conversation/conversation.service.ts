// filepath: /Users/zer/Documents/lab/perso/copoperty-ai-server-nest/src/modules/conversation/conversation.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../entity/conversation.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  async findAll(): Promise<Conversation[]> {
    return this.conversationRepository.find();
  }

  async create(conversationData: Partial<Conversation>): Promise<Conversation> {
    console.log('Creating conversation with data:', conversationData);
    const conversation = this.conversationRepository.create(conversationData);
    console.log('Created conversation:', conversation);
    return this.conversationRepository.save(conversation);
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
