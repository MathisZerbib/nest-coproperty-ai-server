import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { FilesService } from './files.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import * as path from 'path';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiOperation({ summary: 'Serve a file by document ID' })
  @ApiParam({
    name: 'docId',
    type: String,
    description: 'The document ID used to locate the file',
  })
  @ApiResponse({ status: 200, description: 'File served successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 500,
    description: 'Failed to serve the file. Please try again later.',
  })
  @UseGuards(AuthGuard)
  @Get(':docId')
  serveFileByDocId(@Param('docId') docId: string, @Res() res: Response): void {
    try {
      const filePath = this.filesService.findFilePathByDocId(docId);

      if (!filePath) {
        console.error(`File not found for document ID: ${docId}`);
        throw new HttpException(
          `File not found for document ID: ${docId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const fileExtension = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream'; // Default

      // Set correct content type based on file extension
      if (fileExtension === '.pdf') {
        contentType = 'application/pdf';
      } else if (fileExtension === '.docx') {
        contentType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (fileExtension === '.txt') {
        contentType = 'text/plain';
      }

      res.setHeader('Content-Type', contentType);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`Error sending file: ${err.message}`);
          throw new HttpException(
            'Failed to serve the file. Please try again later.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      });
    } catch (error) {
      console.error('Error serving file:', error);
      throw error;
    }
  }
}
