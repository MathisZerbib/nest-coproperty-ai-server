import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
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

  @IsEnum(['urgent', 'in_progress', 'resolved'])
  @IsOptional()
  status?: 'urgent' | 'in_progress' | 'resolved';

  @IsString()
  @IsNotEmpty()
  reportedBy: string;

  @IsBoolean()
  @IsOptional()
  urgent?: boolean;

  @IsArray()
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsNotEmpty()
  residentId: string; // Foreign key to the resident
}
