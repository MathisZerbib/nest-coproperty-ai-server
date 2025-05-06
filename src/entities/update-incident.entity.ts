import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger'; // Added for consistency
import { CreateIncidentDto } from './create-incident.entity';
import { IsArray, IsDateString, IsOptional } from 'class-validator';
import { Copropriete } from './copropriete.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique ID of the incident',
  })
  id: string;

  @ApiProperty({
    example: 'urgent',
    description:
      'Status of the incident, can be "urgent", "in_progress", or "resolved"',
  })
  @IsOptional()
  status?: 'urgent' | 'in_progress' | 'resolved';

  @ApiProperty({
    example: ['urgent', 'water'],
    description: 'Tags associated with the incident',
  })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: '2023-10-01T12:00:00Z',
    description: 'Date when the incident was reported',
  })
  @IsDateString()
  @IsOptional()
  reportedAt?: Date;

  @ApiProperty({
    type: () => Copropriete,
    description: 'The copropriete where the incident occurred',
  })
  @ManyToOne(() => Copropriete, (copropriete) => copropriete.incidents, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coproprieteId' })
  copropriete: Copropriete;
}
