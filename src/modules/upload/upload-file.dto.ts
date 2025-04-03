// src/upload/dto/upload-file.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsJSON, IsOptional, IsString } from 'class-validator';
import { ALLOWED_FOLDERS } from './constants';

export class UploadFileDto {
  @ApiProperty({ enum: ALLOWED_FOLDERS, default: 'document' })
  @IsEnum(ALLOWED_FOLDERS)
  @IsOptional()
  folder?: string;

  @ApiProperty({ description: 'Optional metadata in JSON format' })
  @IsJSON()
  @IsOptional()
  metadata?: string;

  @ApiProperty({
    description: 'Flag to process with Pinecone',
    enum: ['true', 'false'],
    default: 'false',
  })
  @IsString()
  processWithPinecone?: string;
}
