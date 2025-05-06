import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { Conversation } from '../../entities/conversation.entity';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  // @ApiOperation({ summary: 'Get all conversations' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'List of all conversations',
  //   type: [Conversation],
  // })
  // @ApiResponse({
  //   status: 500,
  //   description: 'Internal server error.',
  // })
  // @Get()
  // async findAll(): Promise<Conversation[]> {
  //   return this.conversationService.findAll();
  // }

  /// GET CONVERSATION BY ID
  @ApiOperation({ summary: 'Get a conversation by ID' })
  @ApiResponse({
    status: 200,
    description: 'The conversation details.',
    type: Conversation,
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  @UseGuards(AuthGuard)
  @Get('details/:id')
  async getConversationById(@Param('id') id: string): Promise<Conversation> {
    const conversation = await this.conversationService.getConversationById(id);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }
  // GET ALL CONVERSATIONS BY USER ID
  @ApiOperation({ summary: 'Get all conversations by user ID' })
  @ApiResponse({
    status: 200,
    description: 'List of conversations for the user',
    type: [Conversation],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @UseGuards(AuthGuard)
  @Get()
  async getAllConversationsByUserId(
    @Req() req: { user: { sub: string } }, // Extract user from the request
  ): Promise<Conversation[]> {
    const userId = req.user.sub;
    if (!userId) {
      throw new Error('Unauthorized: User ID not found in token');
    }
    return this.conversationService.getAllConversationsByUserId(userId);
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
      },
    },
  })
  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Req() req: { user: { sub: string } }, // Extract user from the request
    @Body() conversationData: Partial<Conversation>,
  ): Promise<Conversation> {
    const userId = req.user.sub; // Get userId from the JWT payload
    if (!userId) {
      throw new Error('Unauthorized: User ID not found in token');
    }
    if (!conversationData.title) {
      throw new Error('title is required in the request body');
    }
    if (!conversationData.copropriety_id) {
      throw new Error('copropriety_id is required in the request body');
    }
    return this.conversationService.create({ ...conversationData, userId });
  }

  /// PUT CONVERSATION
  @ApiOperation({ summary: 'Update a conversation' })
  @ApiResponse({
    status: 200,
    description: 'The conversation has been successfully updated.',
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
    status: 404,
    description: 'Conversation not found.',
  })
  @UseGuards(AuthGuard)
  @Put(':id')
  async updateConversation(
    @Param('id') id: string,
    @Body() updateData: Partial<Conversation>,
  ): Promise<Conversation> {
    if (!updateData.title && !updateData.copropriety_id) {
      throw new Error(
        'At least one field (title or copropriety_id) is required to update the conversation',
      );
    }

    const updatedConversation =
      await this.conversationService.updateConversation(id, updateData);

    if (!updatedConversation) {
      throw new Error('Conversation not found');
    }

    return updatedConversation;
  }
  /// DELETE CONVERSATION
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({
    status: 200,
    description: 'The conversation has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteConversation(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.conversationService.deleteConversation(id);

    if (!deleted) {
      throw new Error('Conversation not found');
    }

    return { message: 'Conversation deleted successfully' };
  }
}
