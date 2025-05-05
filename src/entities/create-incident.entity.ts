import { ApiProperty } from '@nestjs/swagger'; // Added
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateIncidentDto {
  @ApiProperty({ example: 'Water Leak', description: 'Title of the incident' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'There is a water leak in the kitchen.',
    description: 'Description of the incident',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 'Kitchen',
    description: 'Location of the incident',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    example: 'plumbing',
    description: 'Type of the incident',
    enum: [
      'plumbing',
      'electrical',
      'elevator',
      'common_areas',
      'complaints',
      'security',
      'other',
    ],
  })
  @IsEnum([
    'plumbing',
    'electrical',
    'elevator',
    'common_areas',
    'complaints',
    'security',
    'other',
  ])
  @IsOptional()
  type:
    | 'plumbing'
    | 'electrical'
    | 'elevator'
    | 'common_areas'
    | 'complaints'
    | 'security'
    | 'other';

  @ApiProperty({
    example: 'urgent',
    description: 'Status of the incident',
    enum: ['urgent', 'in_progress', 'resolved'],
  })
  @IsEnum(['urgent', 'in_progress', 'resolved'])
  @IsOptional()
  status?: 'urgent' | 'in_progress' | 'resolved';

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the person who reported the incident',
  })
  @IsString()
  @IsNotEmpty()
  reported_by: string;

  @ApiProperty({
    example: '2025-04-30T14:43:30.288Z',
    description: 'Date when the incident was reported',
  })
  @IsDateString()
  @IsOptional()
  reported_at?: Date;

  @ApiProperty({
    example: true,
    description: 'Whether the incident is urgent',
  })
  @IsBoolean()
  @IsOptional()
  urgent?: boolean;

  @ApiProperty({
    example: ['photo1.jpg', 'photo2.jpg'],
    description: 'Photos related to the incident',
  })
  @IsArray()
  @IsOptional()
  photos?: string[];

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the resident who reported the incident',
  })
  @IsString()
  @IsNotEmpty()
  residentId: string;

  @ApiProperty({
    example: ['file1.pdf', 'file2.pdf'],
    description: 'Files related to the incident',
  })
  @IsArray()
  @IsOptional()
  files?: Express.Multer.File[];
}
