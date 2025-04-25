import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ConfigModule } from '@nestjs/config';
import { PineconeModule } from '../pinecone/pinecone.module';
import { Metadata } from '../../entities/metadata.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    PineconeModule,
    TypeOrmModule.forFeature([Metadata]),
    UsersModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
