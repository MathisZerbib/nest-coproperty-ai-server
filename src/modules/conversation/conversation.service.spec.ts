/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from './conversation.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Conversation } from '../../entities/conversation.entity';
import { Messages } from '../../entities/messages.entity';

describe('ConversationService', () => {
  let service: ConversationService;
  let conversationRepository: jest.Mocked<Repository<Conversation>>;
  let messagesRepository: jest.Mocked<Repository<Messages>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Messages),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
    conversationRepository = module.get(getRepositoryToken(Conversation));
    messagesRepository = module.get(getRepositoryToken(Messages));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all conversations', async () => {
      const mockConversations = [{ id: '1' }, { id: '2' }] as Conversation[];
      conversationRepository.find.mockResolvedValue(mockConversations);

      const result = await service.findAll();
      expect(result).toEqual(mockConversations);
      expect(conversationRepository.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a conversation and a bot message', async () => {
      const mockConversationData = { userId: '123' } as Partial<Conversation>;
      const mockSavedConversation = {
        id: '1',
        ...mockConversationData,
      } as Conversation;
      const mockBotMessage = {
        id: '1',
        created_at: new Date(),
        updated_at: new Date(),
        conversation: mockSavedConversation,
        content: "Bonjour, comment puis-je vous aider aujourd'hui ?",
        role: 'assistant',
        userId: '123',
        sequence_number: 1,
      } as Messages;

      conversationRepository.create.mockReturnValue(mockSavedConversation);
      conversationRepository.save.mockResolvedValue(mockSavedConversation);
      messagesRepository.create.mockReturnValue(mockBotMessage);
      messagesRepository.save.mockResolvedValue(mockBotMessage);

      const result = await service.create(mockConversationData);

      expect(result).toEqual(mockSavedConversation);
      expect(conversationRepository.create).toHaveBeenCalledWith(
        mockConversationData,
      );
      expect(messagesRepository.create).toHaveBeenCalledWith({
        conversation: mockSavedConversation,
        content: "Bonjour, comment puis-je vous aider aujourd'hui ?",
        role: 'assistant',
        userId: '123',
        sequence_number: 1,
      });
      expect(messagesRepository.save).toHaveBeenCalledWith(mockBotMessage);
    });

    it('should throw an error if conversation data is invalid', async () => {
      const invalidConversationData = {} as Partial<Conversation>;

      conversationRepository.create.mockImplementation(() => {
        throw new Error('Invalid data');
      });

      await expect(service.create(invalidConversationData)).rejects.toThrow(
        'Invalid data',
      );
    });
  });

  describe('getRecentConversations', () => {
    it('should return the 10 most recent conversations', async () => {
      const mockConversations = [{ id: '1' }, { id: '2' }] as Conversation[];
      conversationRepository.find.mockResolvedValue(mockConversations);

      const result = await service.getRecentConversations();
      expect(result).toEqual(mockConversations);
      expect(conversationRepository.find).toHaveBeenCalledWith({
        order: { updated_at: 'DESC' },
        take: 10,
      });
    });

    it('should return an empty array if no recent conversations exist', async () => {
      conversationRepository.find.mockResolvedValue([]);

      const result = await service.getRecentConversations();
      expect(result).toEqual([]);
      expect(conversationRepository.find).toHaveBeenCalledWith({
        order: { updated_at: 'DESC' },
        take: 10,
      });
    });
  });

  describe('getAllConversationsByUserId', () => {
    it('should return all conversations for a specific user', async () => {
      const userId = '123';
      const mockConversations = [{ id: '1', userId }] as Conversation[];
      conversationRepository.find.mockResolvedValue(mockConversations);

      const result = await service.getAllConversationsByUserId(userId);
      expect(result).toEqual(mockConversations);
      expect(conversationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { updated_at: 'DESC' },
      });
    });

    it('should return an empty array if the user has no conversations', async () => {
      const userId = '123';
      conversationRepository.find.mockResolvedValue([]);

      const result = await service.getAllConversationsByUserId(userId);
      expect(result).toEqual([]);
      expect(conversationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { updated_at: 'DESC' },
      });
    });
  });

  describe('updateConversation', () => {
    it('should update a conversation', async () => {
      const id = '1';
      const updates = { title: 'Updated Title' } as Partial<Conversation>;
      const mockConversation = { id, title: 'Old Title' } as Conversation;

      conversationRepository.findOne.mockResolvedValue(mockConversation);
      conversationRepository.save.mockResolvedValue({
        ...mockConversation,
        ...updates,
      });

      const result = await service.updateConversation(id, updates);
      expect(result).toEqual({ ...mockConversation, ...updates });
      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(conversationRepository.save).toHaveBeenCalledWith({
        ...mockConversation,
        ...updates,
      });
    });

    it('should throw an error if the conversation is not found', async () => {
      const id = '1';
      const updates = { title: 'Updated Title' } as Partial<Conversation>;

      conversationRepository.findOne.mockResolvedValue(null);

      await expect(service.updateConversation(id, updates)).rejects.toThrow(
        'Conversation not found',
      );
    });

    it('should not update a conversation if no updates are provided', async () => {
      const id = '1';
      const mockConversation = { id, title: 'Old Title' } as Conversation;

      conversationRepository.findOne.mockResolvedValue(mockConversation);
      conversationRepository.save.mockResolvedValue(mockConversation);

      const result = await service.updateConversation(id, {});
      expect(result).toEqual(mockConversation);
      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(conversationRepository.save).toHaveBeenCalledWith(
        mockConversation,
      );
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      const id = '1';
      const mockConversation = { id } as Conversation;

      conversationRepository.findOne.mockResolvedValue(mockConversation);
      conversationRepository.remove.mockResolvedValue(mockConversation);

      const result = await service.deleteConversation(id);
      expect(result).toEqual(mockConversation);
      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(conversationRepository.remove).toHaveBeenCalledWith(
        mockConversation,
      );
    });

    it('should throw an error if the conversation cannot be deleted', async () => {
      const id = '1';
      const mockConversation = { id } as Conversation;

      conversationRepository.findOne.mockResolvedValue(mockConversation);
      conversationRepository.remove.mockImplementation(() => {
        throw new Error('Delete failed');
      });

      await expect(service.deleteConversation(id)).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('getConversationById', () => {
    it('should return a conversation by ID', async () => {
      const id = '1';
      const mockConversation = { id, messages: [] } as unknown as Conversation;

      conversationRepository.findOne.mockResolvedValue(mockConversation);

      const result = await service.getConversationById(id);
      expect(result).toEqual(mockConversation);
      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['messages'],
      });
    });

    it('should throw an error if the conversation is not found', async () => {
      const id = '1';
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(service.getConversationById(id)).rejects.toThrow(
        'Conversation not found',
      );
    });
  });
});
