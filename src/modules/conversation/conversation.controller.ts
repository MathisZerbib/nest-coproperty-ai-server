import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { Conversation } from '../../entity/conversation.entity';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @ApiOperation({ summary: 'Get all conversations' })
  @ApiResponse({
    status: 200,
    description: 'List of all conversations',
    type: [Conversation],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  @Get()
  async findAll(): Promise<Conversation[]> {
    return this.conversationService.findAll();
  }

  @ApiOperation({ summary: 'Get recent conversations' })
  @ApiResponse({
    status: 200,
    description: 'List of recent conversations',
    type: [Conversation],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  @UseGuards(AuthGuard)
  @Get('recent')
  async getRecentConversations(): Promise<Conversation[]> {
    return this.conversationService.getRecentConversations();
  }

  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'The conversation has been successfully created.',
    type: Conversation,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Missing or invalid parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  @ApiBody({
    description: 'Details of the conversation to create',
    required: true,
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the conversation',
          example: 'General Discussion',
        },
        copropriety_id: {
          type: 'string',
          description:
            'The ID of the copropriety associated with the conversation',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        userId: {
          type: 'string',
          description: 'The ID of the user creating the conversation',
          example: '276f9fd7-4707-429f-aef1-abd366b48f1b',
        },
      },
    },
  })
  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() conversationData: Partial<Conversation>,
  ): Promise<Conversation> {
    if (!conversationData.userId) {
      throw new Error('userId is required in the request body');
    }
    if (!conversationData.title) {
      throw new Error('title is required in the request body');
    }
    if (!conversationData.copropriety_id) {
      throw new Error('copropriety_id is required in the request body');
    }
    return this.conversationService.create(conversationData);
  }
}
