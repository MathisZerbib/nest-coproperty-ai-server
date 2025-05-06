/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { Conversation } from '@entity/conversation.entity';
import { AuthGuard } from '../auth/auth.guard';

describe('ConversationController', () => {
  let controller: ConversationController;
  let conversationService: jest.Mocked<ConversationService>;
  const mockAuthGuard = {
    canActivate: jest.fn(() => true), // Mock the AuthGuard to always allow access
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [
        {
          provide: ConversationService,
          useValue: {
            findAll: jest.fn(),
            getConversationById: jest.fn(),
            getAllConversationsByUserId: jest.fn(),
            getRecentConversations: jest.fn(),
            create: jest.fn(),
            updateConversation: jest.fn(),
            deleteConversation: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard) // Override the AuthGuard with the mock
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ConversationController>(ConversationController);
    conversationService = module.get<ConversationService>(
      ConversationService,
    ) as jest.Mocked<ConversationService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getConversationById', () => {
    it('should return a conversation by ID', async () => {
      const mockConversation = {
        id: '1',
        title: 'Test Conversation',
        copropriety_id: 'copro-id',
        userId: 'user-id',
        messages: [],
        created_at: new Date(),
        updated_at: new Date(),
      };
      conversationService.getConversationById.mockResolvedValue(
        mockConversation,
      );

      const result = await controller.getConversationById('1');
      expect(result).toEqual(mockConversation);
      expect(conversationService.getConversationById).toHaveBeenCalledWith('1');
    });

    it('should throw an error if the conversation is not found', async () => {
      conversationService.getConversationById.mockResolvedValue(null as any);

      await expect(controller.getConversationById('1')).rejects.toThrowError(
        'Conversation not found',
      );
    });
  });

  describe('getAllConversationsByUserId', () => {
    it('should return a list of conversations for a user', async () => {
      const mockConversations: Conversation[] = [
        {
          id: '1',
          title: 'Test Conversation 1',
          copropriety_id: '',
          userId: '',
          messages: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          title: 'Test Conversation 2',
          copropriety_id: '',
          userId: '',
          messages: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      const mockUser = { sub: 'user-id' };
      const req = { user: mockUser };

      conversationService.getAllConversationsByUserId.mockResolvedValue(
        mockConversations,
      );

      const result = await controller.getAllConversationsByUserId(req);
      expect(result).toEqual(mockConversations);
      expect(
        conversationService.getAllConversationsByUserId,
      ).toHaveBeenCalledWith('user-id');
    });

    it('should throw an error if user is not found', async () => {
      const req = { user: { sub: '' } };

      await expect(
        controller.getAllConversationsByUserId(req),
      ).rejects.toThrowError('Unauthorized: User ID not found in token');
    });
  });

  describe('create', () => {
    it('should create a new conversation', async () => {
      const mockConversationData = {
        title: 'New Conversation',
        copropriety_id: 'copro-id',
      };
      const mockCreatedConversation = {
        id: '1',
        title: 'New Conversation',
        copropriety_id: 'copro-id',
        userId: 'user-id',
        messages: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      conversationService.create.mockResolvedValue(mockCreatedConversation);

      const req = { user: { sub: 'user-id' } };
      const result = await controller.create(req, mockConversationData);

      expect(result).toEqual(mockCreatedConversation);
      expect(conversationService.create).toHaveBeenCalledWith({
        ...mockConversationData,
        userId: 'user-id',
      });
    });

    it('should throw an error if title is missing', async () => {
      const req = { user: { sub: 'user-id' } };
      const invalidConversationData = { copropriety_id: 'copro-id' };

      await expect(
        controller.create(req, invalidConversationData),
      ).rejects.toThrowError('title is required in the request body');
    });

    it('should throw an error if copropriety_id is missing', async () => {
      const req = { user: { sub: 'user-id' } };
      const invalidConversationData = { title: 'Test Conversation' };

      await expect(
        controller.create(req, invalidConversationData),
      ).rejects.toThrowError('copropriety_id is required in the request body');
    });
  });

  describe('updateConversation', () => {
    it('should update a conversation', async () => {
      const updateData = { title: 'Updated Conversation' };
      const mockConversation = {
        id: '1',
        title: 'Test Conversation',
        copropriety_id: 'copro-id',
        userId: 'user-id',
        messages: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      conversationService.updateConversation.mockResolvedValue({
        ...mockConversation,
        ...updateData,
      });

      const result = await controller.updateConversation('1', updateData);
      expect(result).toEqual({ ...mockConversation, ...updateData });
      expect(conversationService.updateConversation).toHaveBeenCalledWith(
        '1',
        updateData,
      );
    });

    it('should throw an error if no title or copropriety_id is provided', async () => {
      const updateData = {};
      await expect(
        controller.updateConversation('1', updateData),
      ).rejects.toThrowError(
        'At least one field (title or copropriety_id) is required to update the conversation',
      );
    });

    it('should throw an error if conversation is not found', async () => {
      const updateData = { title: 'Updated Title' };
      conversationService.updateConversation.mockResolvedValue(null as any);

      await expect(
        controller.updateConversation('1', updateData),
      ).rejects.toThrowError('Conversation not found');
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      const mockConversation = {
        id: '1',
        title: 'Test Conversation',
        copropriety_id: 'copro-id',
        userId: 'user-id',
        messages: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      conversationService.deleteConversation.mockResolvedValue(
        mockConversation,
      );

      const result = await controller.deleteConversation('1');
      expect(result).toEqual({ message: 'Conversation deleted successfully' });
      expect(conversationService.deleteConversation).toHaveBeenCalledWith('1');
    });

    it('should throw an error if conversation is not found', async () => {
      conversationService.deleteConversation.mockResolvedValue(null as any);

      await expect(controller.deleteConversation('1')).rejects.toThrowError(
        'Conversation not found',
      );
    });
  });
});
