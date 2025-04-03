import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PineconeService } from '../pinecone/pinecone.service';
import * as fs from 'fs';
import * as path from 'path';
import { generateFileName } from './constants';
import { pdfToPng, PngPageOutput } from 'pdf-to-png-converter';
import * as Tesseract from 'tesseract.js';
import { DocumentUpload } from '../pinecone/pinecone-model';

@Injectable()
export class UploadService {
  constructor(private readonly pineconeService: PineconeService) {}

  // Helper Function to check if the file is a valid PDF
  private isPdf(file: Express.Multer.File): boolean {
    return /application\/pdf/.test(file.mimetype);
  }

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

  // Helper function to sanitize IDs for Pinecone
  private sanitizeId(id: string): string {
    // Replace null characters and other problematic characters
    // Remove non-printable ASCII characters
    // Replace filesystem reserved characters
    return id
      .replace(/\0/g, '') // Remove null characters
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/[\\/|?*:<>]/g, '-') // Replace filesystem reserved characters
      .trim(); // Remove leading/trailing whitespace
  }

  // Helper method to ensure the upload directory exists
  private ensureUploadDirectory(): string {
    const uploadDir = path.join(__dirname, '../../../uploads/document');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  // Function to apply OCR on image
  private async extractTextFromImage(filePath: string): Promise<string> {
    console.log('Applying OCR to image:', filePath);
    const {
      data: { text },
    } = await Tesseract.recognize(filePath, 'fra', {
      logger: (m) => console.log(m),
    });
    return text;
  }

  // Helper function to convert PDF to images using pdf-to-png-converter
  private async convertPdfToImages(filePath: string): Promise<string[]> {
    console.log('Converting PDF to images...');
    const uploadDir = this.ensureUploadDirectory();

    try {
      const options = {
        viewportScale: 2.0,
        outputFolder: uploadDir,
        outputFileMaskFunc: (pageNumber: number) => `page_${pageNumber}.png`,
      };

      const result: PngPageOutput[] = await pdfToPng(filePath, options);

      if (!Array.isArray(result)) {
        throw new HttpException(
          'Unexpected response from PDF to PNG conversion',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Return the paths to the generated PNG files
      return result.map((page) => page.path);
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw new HttpException(
        'Failed to convert PDF to images',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Process the uploaded file
  async processFile(
    file: Express.Multer.File,
    metadata: string | undefined,
  ): Promise<string> {
    this.validateFile(file);
    const safeFileName = generateFileName(file);

    console.log(`Processing file: ${safeFileName}`);

    try {
      // Save the file to the server
      const uploadDir = this.ensureUploadDirectory();
      const filePath = path.join(uploadDir, safeFileName);
      await fs.promises.writeFile(filePath, file.buffer);

      let fileText = '';
      if (this.isPdf(file)) {
        console.log('Extracting text from PDF...');

        // Convert PDF to images and get the image paths
        const imagePaths = await this.convertPdfToImages(filePath);

        // Run OCR on each image
        for (const imagePath of imagePaths) {
          const textFromImage = await this.extractTextFromImage(imagePath);
          fileText += textFromImage;
          console.log(
            `Extracted text from ${path.basename(imagePath)}: ${textFromImage.substring(0, 50)}...`,
          );
        }
      } else {
        // For non-PDF files, you might want to implement different text extraction logic
        // or directly run OCR if it's an image
        console.log('File is not a PDF, skipping text extraction');
        throw new HttpException(
          'Only PDF files are supported at this time.',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log(`Extracted text length: ${fileText.length}`);
      if (!fileText.trim()) {
        console.warn(
          'No text extracted from the file. The file might be empty or contain non-extractable content.',
        );
        throw new HttpException(
          'No text could be extracted from the file. Please check the file content.',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log(`Extracted text sample: ${fileText.substring(0, 100)}...`);

      const chunkSize = 500; // Number of characters per chunk
      const chunks = fileText.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [];
      if (chunks.length === 0) {
        console.warn('No chunks were created from the extracted text.');
        throw new HttpException(
          'Failed to create chunks from the extracted text. Please check the file content.',
          HttpStatus.BAD_REQUEST,
        );
      }
      console.log(`Created ${chunks.length} chunks from the file.`);

      console.log(
        'Generating embeddings and ingesting chunks into Pinecone...',
      );
      await Promise.all(
        chunks.map(async (chunk, idx) => {
          if (!chunk) {
            console.warn(`Chunk ${idx + 1} is empty. Skipping...`);
            return;
          }
          // Generate embedding for the chunk
          console.log(`Generating embedding for chunk ${idx + 1}...`);
          const parsedMetadata: Record<string, string | number | boolean> =
            metadata
              ? (JSON.parse(metadata) as Record<
                  string,
                  string | number | boolean
                >)
              : {};
          // rename the metadata key to avoid collision
          parsedMetadata.fileName = generateFileName(file);
          const chunkMetadata = {
            ...parsedMetadata,
            chunkIndex: idx + 1,
            fileName: generateFileName(file),
            totalChunks: chunks.length,
          };
          // Sanitize the ID for Pinecone
          const sanitizedId = this.sanitizeId(
            `${safeFileName}#chunk${idx + 1}`,
          );
          // Add the chunk text to the metadata

          const documentUpload: DocumentUpload = {
            id: sanitizedId,
            fileName: generateFileName(file),
            date: new Date().toISOString(),
            size: file.size.toString(),
            type: file.mimetype,
            text: chunk,
            metadata: chunkMetadata,
          };

          // Use PineconeService to upsert the chunk
          await this.pineconeService.upsertDocuments([documentUpload]);
          console.log(
            `Chunk ${idx + 1}/${chunks.length} ingested into Pinecone with ID: ${generateFileName(file)}#chunk${idx + 1}`,
          );
        }),
      );

      // Clean up temporary image files if needed
      // This cleanup step can be implemented here

      return `File "${safeFileName}" processed and ingested into Pinecone successfully. Created ${chunks.length} chunks.`;
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
