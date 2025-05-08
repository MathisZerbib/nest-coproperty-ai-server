import {
  Controller,
  Get,
  Query,
  Body,
  Post,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { Conversation } from '../../entities/conversation.entity';
import { Messages } from '../../entities/messages.entity';
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
  @UseGuards(AuthGuard)
  @Post('ask/stream')
  async streamLLMResponse(
    @Body()
    body: {
      conversationId: string;
      userId: string;
      content: string;
    },
    @Res() res: Response,
  ): Promise<void> {
    const { conversationId, userId, content } = body;

    if (!conversationId || !userId || !content) {
      res.status(400).send('Bad Request: Missing required parameters');
      return;
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Flush headers immediately
    res.flushHeaders?.();

    // Optional: keep-alive ping every 20 seconds
    const keepAlive = setInterval(() => {
      res.write(':\n\n'); // Comment line to keep the connection open
    }, 20000);

    try {
      // Query the local LLM with streaming
      // const stream = await this.messagesService.queryLocalLLMStream(content);
      const stream = await this.messagesService.askQuestionWithStream(
        conversationId,
        userId,
        content,
      );
      if (!stream) {
        res.status(500).send('Internal Server Error: No stream available');
        return;
      }

      let buffer = ''; // Buffer to store incomplete words or sentences
      let aggregatedContent = ''; // Variable to store the entire response
      // Stream the assistant's messages incrementally
      for await (const chunk of stream) {
        buffer += chunk; // Append the chunk to the buffer
        aggregatedContent += chunk; // Append the chunk to the full response

        // Check if the buffer ends with a complete sentence or word
        if (
          buffer.endsWith(' ') || // Ends with a space
          buffer.endsWith('.') || // Ends with a period
          buffer.endsWith('\n') // Ends with a newline
        ) {
          // Send the complete buffer to the client
          res.write(`${buffer}\n\n`);
          buffer = ''; // Clear the buffer
        }
      }

      // Send any remaining content in the buffer
      if (buffer) {
        res.write(`${buffer}\n\n`);
      }

      clearInterval(keepAlive);
      res.end();

      // Save the full response to the database after streaming
      const conversation =
        await this.messagesService.getConversationById(conversationId);
      const sequenceNumber = conversation.messages.length + 1;

      // Save the user's question
      await this.messagesService.createMessage({
        conversation,
        content: content,
        role: 'user',
        userId,
        sequence_number: sequenceNumber,
      });

      // Save the full assistant response
      await this.messagesService.createMessage({
        conversation,
        content: aggregatedContent, // Save the full aggregated response
        role: 'assistant',
        userId,
        sequence_number: sequenceNumber + 1,
      });
    } catch (err) {
      console.error('Streaming error:', err);
      clearInterval(keepAlive);
      res.status(500).send('Internal Server Error');
    }
  }
}

// @UseGuards(AuthGuard)
// @Post('ask')
// async askQuestion(
//   @Body()
//   body: {
//     conversationId: string;
//     userId: string;
//     content: string;
//   },
// ) {
//   const { conversationId, userId, content } = body;

//   // Wait for the LLM response and return both messages
//   const { userMessage, assistantMessage } =
//     await this.messagesService.askQuestion(conversationId, userId, content);

//   return {
//     userMessage,
//     assistantMessage,
//   };
// }

// @ApiOperation({
//   summary: 'Stream LLM response for a user question',
//   description:
//     'Stream the assistant’s response for a user question and save the conversation messages incrementally.',
// })
// @ApiResponse({
//   status: 200,
//   description: 'Streaming response from the assistant.',
// })
// @ApiResponse({
//   status: 400,
//   description: 'Bad request. Missing or invalid parameters.',
// })
// @ApiResponse({
//   status: 500,
//   description: 'Internal server error. An unexpected error occurred.',
// })
