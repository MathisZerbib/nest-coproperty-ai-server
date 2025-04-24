import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { generateFileName } from './constants';
import { PrivategptApiClient } from 'privategpt-sdk-node';

@Injectable()
export class UploadService {
  private readonly privateGptClient = new PrivategptApiClient({
    environment: 'http://localhost:8001', // PrivateGPT API endpoint
  });

  // Helper method to validate the file
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new HttpException(
        'No file provided. Please upload a file.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new HttpException(
        'File size exceeds the limit of 10MB.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (file.size === 0) {
      throw new HttpException(
        'File is empty. Please upload a valid file.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Helper method to ensure the upload directory exists
  private ensureUploadDirectory(): string {
    const uploadDir = path.join(__dirname, '../../../uploads/document');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  // Process the uploaded file and ingest it into PrivateGPT
  async processFile(
    file: Express.Multer.File,
    folder: 'document' | 'legal' | 'resident',
    metadata?: string,
  ): Promise<{ message: string; fileUrl: string; docId: string }> {
    this.validateFile(file);
    const safeFileName = generateFileName(file);

    console.log(`Processing file: ${safeFileName}`);

    try {
      // Ensure the folder exists
      const uploadDir = path.join(__dirname, `../../../uploads/${folder}`);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save the file to the specified folder
      const filePath = path.join(uploadDir, safeFileName);
      await fs.promises.writeFile(filePath, file.buffer);

      console.log('Uploading file to PrivateGPT...');
      try {
        // Convert Multer file to File
        const fileObject = new File([file.buffer], safeFileName, {
          type: file.mimetype,
        });

        // Ingest the file into PrivateGPT
        const ingestResponse =
          await this.privateGptClient.ingestion.ingestFile(fileObject);
        const ingestedFileDocId = ingestResponse.data[0].docId;

        console.log(
          `File ingested into PrivateGPT with doc ID: ${ingestedFileDocId}`,
        );

        // Parse metadata if provided
        let parsedMetadata: { type?: string } = {};
        if (metadata) {
          try {
            parsedMetadata = JSON.parse(metadata) as { type?: string };
          } catch (error) {
            console.error('Error parsing metadata:', error);
            throw new HttpException(
              'Invalid metadata format',
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        // Save metadata to a log file
        const metadataLogPath = path.join(uploadDir, 'metadata-log.json');
        const metadataEntry = {
          fileName: safeFileName,
          docId: ingestedFileDocId,
          fileUrl: `/uploads/${folder}/${safeFileName}`,
          type: parsedMetadata.type || 'unknown', // Correctly access the type field
        };
        const existingMetadata: Array<Record<string, any>> = fs.existsSync(
          metadataLogPath,
        )
          ? (JSON.parse(
              await fs.promises.readFile(metadataLogPath, 'utf8'),
            ) as Array<Record<string, any>>)
          : [];
        existingMetadata.push(metadataEntry);
        await fs.promises.writeFile(
          metadataLogPath,
          JSON.stringify(existingMetadata, null, 2),
        );

        // Return the file URL and doc ID
        return {
          message: `File "${safeFileName}" processed and ingested into PrivateGPT successfully.`,
          fileUrl: `/uploads/${folder}/${safeFileName}`,
          docId: ingestedFileDocId,
        };
      } catch (error) {
        console.error('Error during ingestion into PrivateGPT:', error);
        throw new HttpException(
          'Failed to ingest file into PrivateGPT. Please check the server logs for more details.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error; // Re-throw HTTP exceptions as they are already formatted
      }

      if (error instanceof Error) {
        console.error('Error processing file:', error.message);
        console.error(error.stack);
      } else {
        console.error('Error processing file:', String(error));
      }

      throw new HttpException(
        'Failed to process and ingest the file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Simple file upload function
  async uploadFile(file: Express.Multer.File): Promise<string> {
    this.validateFile(file);

    try {
      // Save the file to the server
      const uploadDir = this.ensureUploadDirectory();
      const safeFileName = generateFileName(file);
      const filePath = path.join(uploadDir, safeFileName);
      await fs.promises.writeFile(filePath, file.buffer);

      return `File "${generateFileName(file)}" uploaded successfully`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new HttpException(
        'Failed to upload the file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
