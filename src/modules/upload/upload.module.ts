import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ConfigModule } from '@nestjs/config';
import { PineconeModule } from '../pinecone/pinecone.module'; // ✅ Import PineconeModule

@Module({
  imports: [ConfigModule, PineconeModule], // ✅ Import PineconeModule
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
