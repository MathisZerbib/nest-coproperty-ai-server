import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metadata } from '../../entities/metadata.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly uploadsRoot = path.resolve(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Metadata)
    private readonly metadataRepository: Repository<Metadata>,
  ) {}

  async findFilePathByDocId(docId: string): Promise<string> {
    console.log(`Searching for file with docId: ${docId}`);

    const record = await this.metadataRepository.findOne({ where: { docId } });

    if (!record) {
      console.error(`File not found for document ID: ${docId}`);
      throw new HttpException(
        'File not found for document ID',
        HttpStatus.NOT_FOUND,
      );
    }

    const filePath = path.join(this.uploadsRoot, record.fileUrl);
    // console.log(`File path resolved: ${filePath}`);
    // console.log(`File exists: ${fs.existsSync(filePath)}`);
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      throw new HttpException('File not found on disk', HttpStatus.NOT_FOUND);
    }

    return filePath;
  }

  async findMetadataByDocId(docId: string): Promise<Metadata> {
    console.log(`Searching for metadata with docId: ${docId}`);

    const record = await this.metadataRepository.findOne({ where: { docId } });

    if (!record) {
      console.error(`Metadata not found for docId: ${docId}`);
      throw new HttpException('Metadata not found', HttpStatus.NOT_FOUND);
    }

    return record;
  }

  async deleteDocumentByDocId(docId: string): Promise<void> {
    console.log(`Deleting document with docId: ${docId}`);

    const record = await this.metadataRepository.findOne({ where: { docId } });

    if (!record) {
      console.error(`Document not found for docId: ${docId}`);
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    // Delete the file from the file system
    const filePath = path.join(this.uploadsRoot, record.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    } else {
      console.error(`File does not exist: ${filePath}`);
    }

    // Delete the metadata from the database
    await this.metadataRepository.delete({ docId });
    console.log(`Deleted metadata for docId: ${docId}`);
  }

  async saveMetadata(metadata: Partial<Metadata>): Promise<Metadata> {
    const newMetadata = this.metadataRepository.create(metadata);
    return await this.metadataRepository.save(newMetadata);
  }
}
