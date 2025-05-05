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
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  location: string;

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

  @IsEnum(['urgent', 'in_progress', 'resolved'])
  @IsOptional()
  status?: 'urgent' | 'in_progress' | 'resolved';

  @IsString()
  @IsNotEmpty()
  reported_by: string;

  /// reported_at "2025-04-30T14:43:30.288Z"
  @IsDateString()
  @IsOptional()
  reported_at?: Date;

  @IsBoolean()
  @IsOptional()
  urgent?: boolean;

  @IsArray()
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsNotEmpty()
  residentId: string; // Foreign key to the resident

  // files
  @IsArray()
  @IsOptional()
  files?: Express.Multer.File[];
}
