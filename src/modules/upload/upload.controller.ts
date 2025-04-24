import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
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
        folder: {
          type: 'string',
          enum: ['document', 'legal', 'resident'],
          description: 'Folder to upload the file to',
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
    @Body('folder') folder: 'document' | 'legal' | 'resident',
    @Body('processWithPrivateGPT') processWithPrivateGPT: string,
    @Body('metadata') metadata?: string,
  ): Promise<{ message: string; fileUrl: string }> {
    // Validate the folder
    if (!['document', 'legal', 'resident'].includes(folder)) {
      throw new HttpException(
        'Invalid folder. Allowed values are "document", "legal", or "resident".',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate the file
    if (!file) {
      throw new HttpException(
        'No file uploaded. Please upload a valid PDF file.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Process the file with PrivateGPT or just upload it
      if (processWithPrivateGPT === 'true') {
        return await this.uploadService.processFile(file, folder, metadata);
      } else {
        const message = await this.uploadService.uploadFile(file);
        return { message, fileUrl: `/uploads/${folder}/${file.originalname}` };
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in uploadFile:', error.message);
      } else {
        console.error('Error in uploadFile:', error);
      }
      throw new HttpException(
        'Failed to upload and process the file. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
