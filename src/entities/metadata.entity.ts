import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger'; // Added

@Entity('metadata')
export class Metadata {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique ID of the metadata',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'document.pdf', description: 'Name of the file' })
  @Column()
  fileName: string;

  @ApiProperty({
    example: 'doc-123',
    description: 'Document ID associated with the file',
  })
  @Column()
  docId: string;

  @ApiProperty({
    example: 'https://example.com/files/document.pdf',
    description: 'URL of the file',
  })
  @Column()
  fileUrl: string;

  @ApiProperty({ example: 'pdf', description: 'Type of the file' })
  @Column()
  type: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the user who uploaded the file',
  })
  @Column({ type: 'uuid' })
  userId: string;
}
