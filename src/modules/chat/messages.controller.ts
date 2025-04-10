import { Controller, Get, Query, Body, Post, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { Conversation } from '../../entity/conversation.entity';
import { Messages } from '../../entity/messages.entity';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({
    summary: 'Get a conversation by ID',
    description:
      'Retrieve a conversation by its unique ID, including all related messages.',
  })
  @ApiResponse({
    status: 200,
    description: 'The conversation details, including messages.',
    type: Conversation,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. The provided ID is missing or invalid.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Conversation not found. No conversation exists with the provided ID.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error. An unexpected error occurred.',
  })
  @UseGuards(AuthGuard)
  @Get('conversations')
  async getConversationById(@Query('id') id: string): Promise<Conversation> {
    return this.messagesService.getConversationById(id);
  }

  @ApiOperation({
    summary: 'Create a new message in a conversation',
    description:
      'Add a new message to an existing conversation. The message must include content, user ID, and conversation ID.',
  })
  @ApiResponse({
    status: 201,
    description: 'The message has been successfully created.',
    type: Messages,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Missing or invalid parameters in the request body.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Conversation not found. The provided conversation ID does not exist.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error. An unexpected error occurred.',
  })
  @ApiBody({
    description: 'Details of the message to create.',
    required: true,
    schema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description:
            'The ID of the conversation to which the message belongs.',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        userId: {
          type: 'string',
          description: 'The ID of the user sending the message.',
          example: '456e7890-e12b-34d5-f678-526714174111',
        },
        content: {
          type: 'string',
          description: 'The content of the message.',
          example: 'Hello, how can I help you?',
        },
        role: {
          type: 'string',
          description: 'The role of the sender (e.g., "user" or "assistant").',
          example: 'user',
        },
      },
    },
  })
  // @UseGuards(AuthGuard)
  // @Post('create')
  // async createMessage(@Body() message: Partial<Messages>): Promise<Messages> {
  //   return this.messagesService.createMessage(message);
  // }

  // @ApiOperation({
  //   summary: 'Ask a question to the assistant',
  //   description:
  //     'Send a question to the assistant and receive a response. The question is stored in the conversation along with the assistant’s reply.',
  // })
  // @ApiResponse({
  //   status: 201,
  //   description:
  //     'The question has been successfully processed, and the assistant’s response has been saved.',
  //   type: Messages,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description:
  //     'Bad request. Missing or invalid parameters in the request body.',
  // })
  // @ApiResponse({
  //   status: 404,
  //   description:
  //     'Conversation not found. The provided conversation ID does not exist.',
  // })
  // @ApiResponse({
  //   status: 500,
  //   description: 'Internal server error. An unexpected error occurred.',
  // })
  // @ApiBody({
  //   description: 'Details of the question to ask the assistant.',
  //   required: true,
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       conversationId: {
  //         type: 'string',
  //         description:
  //           'The ID of the conversation to which the question belongs.',
  //         example: '123e4567-e89b-12d3-a456-426614174000',
  //       },
  //       userId: {
  //         type: 'string',
  //         description: 'The ID of the user asking the question.',
  //         example: '456e7890-e12b-34d5-f678-526714174111',
  //       },
  //       question: {
  //         type: 'string',
  //         description: 'The question to ask the assistant.',
  //         example: 'What is the capital of France?',
  //       },
  //     },
  //   },
  // })
  @UseGuards(AuthGuard)
  @Post('ask')
  async askQuestion(
    @Body()
    body: {
      conversationId: string;
      userId: string;
      content: string;
    },
  ) {
    const { conversationId, userId, content } = body;

    // Wait for the LLM response and return both messages
    const { userMessage, assistantMessage } =
      await this.messagesService.askQuestion(conversationId, userId, content);

    return {
      userMessage,
      assistantMessage,
    };
  }
}
