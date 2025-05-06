import { ApiProperty } from '@nestjs/swagger'; // Added
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Resident } from './resident.entity';
import { Copropriete } from './copropriete.entity';

@Entity('incidents')
export class Incident {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique ID of the incident',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Water Leak', description: 'Title of the incident' })
  @Column({ type: 'varchar', length: 150 })
  title: string;

  @ApiProperty({
    example: 'There is a water leak in the kitchen.',
    description: 'Description of the incident',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 'Kitchen', description: 'Location of the incident' })
  @Column({ type: 'varchar', length: 100 })
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
  @Column({
    enum: [
      'plumbing',
      'electrical',
      'elevator',
      'common_areas',
      'complaints',
      'security',
      'other',
    ],
    type: 'enum',
    default: 'other',
  })
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
    enum: ['reported', 'urgent', 'in_progress', 'resolved'],
  })
  @Column({
    type: 'enum',
    enum: ['reported', 'urgent', 'in_progress', 'resolved'],
    default: 'reported',
  })
  status: 'reported' | 'urgent' | 'in_progress' | 'resolved';

  @ApiProperty({ example: true, description: 'Whether the incident is urgent' })
  @Column({ type: 'boolean', default: false })
  urgent: boolean;

  @ApiProperty({
    example: ['photo1.jpg', 'photo2.jpg'],
    description: 'Photos related to the incident',
  })
  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @ApiProperty({
    type: () => Resident,
    description: 'The resident who reported the incident',
  })
  @ManyToOne(() => Resident, (resident) => resident.incidents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @ApiProperty({
    type: () => Copropriete,
    description: 'The copropriete where the incident occurred',
  })
  @ManyToOne(() => Copropriete, (copropriete) => copropriete.incidents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coproprieteId' })
  copropriete: Copropriete;
  @ApiProperty({
    example: '2025-04-30T14:43:30.288Z',
    description: 'Date when the incident was reported',
  })
  @CreateDateColumn()
  reported_at: Date;

  @ApiProperty({
    example: '2025-05-01T14:43:30.288Z',
    description: 'Date when the incident was last updated',
  })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the person who reported the incident',
  })
  @Column({ type: 'varchar', length: 100 })
  reported_by: string;

  @ApiProperty({
    example: 'Jane Doe',
    description: 'Name of the person who resolved the incident',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  resolved_by: string;
}
