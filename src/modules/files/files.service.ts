import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface FileMetadata {
  fileName: string;
  docId: string;
  fileUrl: string;
}

@Injectable()
export class FilesService {
  private readonly folders = ['document', 'legal', 'resident'];
  private readonly uploadsRoot = path.resolve(process.cwd(), 'uploads');

  findFilePathByDocId(docId: string): string {
    console.log(`Searching for file with docId: ${docId}`);

    if (docId.includes('..')) {
      throw new HttpException('Invalid document ID', HttpStatus.BAD_REQUEST);
    }

    for (const folder of this.folders) {
      const folderPath = path.join(this.uploadsRoot, folder);
      const metadataPath = path.join(folderPath, 'metadata-log.json');

      console.log(`Checking folder: ${folderPath}`);

      if (fs.existsSync(metadataPath)) {
        const metadataRaw = fs.readFileSync(metadataPath, 'utf-8');

        let metadata: FileMetadata[];
        try {
          metadata = JSON.parse(metadataRaw) as FileMetadata[];
        } catch {
          throw new HttpException(
            'Invalid metadata format',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const record = metadata.find((entry) => entry.docId === docId);
        if (record) {
          const filePath = path.join(folderPath, record.fileName);
          console.log(`Found file: ${filePath}`);
          if (fs.existsSync(filePath)) {
            return filePath;
          } else {
            console.error(`File does not exist: ${filePath}`);
          }
        }
      }
    }

    console.error(`File not found for docId: ${docId}`);
    throw new HttpException('File not found', HttpStatus.NOT_FOUND);
  }

  findMetadataByDocId(docId: string): Record<string, any> {
    console.log(`Searching for metadata with docId: ${docId}`);

    if (docId.includes('..')) {
      throw new HttpException('Invalid document ID', HttpStatus.BAD_REQUEST);
    }

    for (const folder of this.folders) {
      const folderPath = path.join(this.uploadsRoot, folder);
      const metadataPath = path.join(folderPath, 'metadata-log.json');

      console.log(`Checking folder: ${folderPath}`);

      if (fs.existsSync(metadataPath)) {
        const metadataRaw = fs.readFileSync(metadataPath, 'utf-8');

        let metadata: Array<Record<string, any>>;
        try {
          metadata = JSON.parse(metadataRaw) as Array<Record<string, any>>;
        } catch {
          throw new HttpException(
            'Invalid metadata format',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const record = metadata.find((entry) => entry.docId === docId);
        if (record) {
          console.log(`Found metadata: ${JSON.stringify(record)}`);
          return record;
        }
      }
    }

    console.error(`Metadata not found for docId: ${docId}`);
    throw new HttpException('Metadata not found', HttpStatus.NOT_FOUND);
  }

  deleteDocumentByDocId(docId: string): void {
    console.log(`Deleting document with docId: ${docId}`);

    if (docId.includes('..')) {
      throw new HttpException('Invalid document ID', HttpStatus.BAD_REQUEST);
    }

    for (const folder of this.folders) {
      const folderPath = path.join(this.uploadsRoot, folder);
      const metadataPath = path.join(folderPath, 'metadata-log.json');

      console.log(`Checking folder: ${folderPath}`);

      if (fs.existsSync(metadataPath)) {
        const metadataRaw = fs.readFileSync(metadataPath, 'utf-8');

        let metadata: FileMetadata[];
        try {
          metadata = JSON.parse(metadataRaw) as FileMetadata[];
        } catch {
          throw new HttpException(
            'Invalid metadata format',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const recordIndex = metadata.findIndex(
          (entry) => entry.docId === docId,
        );
        if (recordIndex !== -1) {
          const record = metadata[recordIndex];
          const filePath = path.join(folderPath, record.fileName);

          // Delete the file if it exists
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
          } else {
            console.error(`File does not exist: ${filePath}`);
          }

          // Remove the metadata entry
          metadata.splice(recordIndex, 1);
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
          console.log(`Deleted metadata for docId: ${docId}`);
          return;
        }
      }
    }

    console.error(`Document not found for docId: ${docId}`);
    throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
  }
}
