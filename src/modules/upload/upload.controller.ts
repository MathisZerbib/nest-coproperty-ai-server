import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { UploadService } from './upload.service';
import { memoryStorage } from 'multer';
import { MAX_FILE_SIZE } from './constants';

@ApiTags('Upload')
@Controller('upload')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // Use memoryStorage to keep the file in memory
      limits: { fileSize: MAX_FILE_SIZE }, // Limit file size
      fileFilter: (_, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true); // Accept PDF files
        } else {
          cb(new Error('Unsupported file type'), false); // Reject other file types
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload a file and optionally process it with Pinecone',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload with metadata and processing options',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
        metadata: {
          type: 'string',
          description: 'Optional metadata in JSON format',
          example: '{"author": "John Doe", "type": "document"}',
        },
        processWithPinecone: {
          type: 'string',
          enum: ['true', 'false'],
          description:
            'Flag to determine if the file should be processed with Pinecone',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or file not uploaded',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadata: string,
    @Body('processWithPinecone') processWithPinecone: string,
  ): Promise<{ message: string }> {
    // Validate the file
    if (!file) {
      throw new Error('No file uploaded. Please upload a valid PDF file.');
    }

    // Process the file with Pinecone or just upload it
    let message: string;
    if (processWithPinecone === 'true') {
      // Process the file with Pinecone
      message = await this.uploadService.processFile(file, metadata);
    } else {
      // Just upload the file without processing
      message = await this.uploadService.uploadFile(file);
    }

    return { message };
  }
}
