import { ApiProperty } from '@nestjs/swagger'; // Added
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Incident } from './incidents.entity';
import { Copropriete } from './copropriete.entity';

@Entity('residents')
export class Resident {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique ID of the resident',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'John', description: 'First name of the resident' })
  @Column({ name: 'firstName', type: 'varchar', length: 100 })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the resident' })
  @Column({ name: 'lastName', type: 'varchar', length: 100 })
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the resident',
  })
  @Column({ name: 'email', type: 'varchar', length: 150, unique: true })
  email: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number of the resident',
  })
  @Column({ name: 'phone', type: 'varchar', length: 15, nullable: true })
  phone: string;

  @ApiProperty({
    example: 'Apt 101',
    description: 'Apartment number of the resident',
  })
  @Column({ name: 'apartment', type: 'varchar', length: 50 })
  apartment: string;

  @ApiProperty({
    example: 'profile.jpg',
    description: 'Profile image of the resident',
  })
  @Column({
    name: 'profileImage',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  profileImage: string;

  @ApiProperty({
    type: () => [Incident],
    description: 'List of incidents reported by the resident',
  })
  @OneToMany(() => Incident, (incident) => incident.resident)
  incidents: Incident[];

  @ApiProperty({
    type: () => Copropriete,
    description: 'The copropriete associated with the resident',
  })
  @ManyToOne(() => Copropriete, (coproperty) => coproperty.residents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'copropertyId' })
  copropertyId: Copropriete;

  @ApiProperty({
    example: 'tenant',
    description: 'Status of the resident (owner, tenant, or both)',
    enum: ['owner', 'tenant', 'both'],
  })
  @Column({
    name: 'status',
    type: 'enum',
    enum: ['owner', 'tenant', 'both'],
    default: 'tenant',
  })
  status: 'owner' | 'tenant' | 'both';

  @ApiProperty({
    example: '2025-01-01',
    description: 'Move-in date of the resident',
  })
  @Column({ name: 'moveInDate', type: 'date', nullable: true })
  moveInDate: Date;

  @ApiProperty({
    example: 'This resident has been living here for 2 years.',
    description: 'Additional notes about the resident',
  })
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @ApiProperty({
    example: '2025-05-01T12:00:00.000Z',
    description: 'Date when the resident was created',
  })
  @CreateDateColumn({ name: 'createdAt' }) // camelCase for consistency
  createdAt: Date;

  @ApiProperty({
    example: '2025-05-02T12:00:00.000Z',
    description: 'Date when the resident was last updated',
  })
  @UpdateDateColumn({ name: 'updatedAt' }) // camelCase for consistency
  updatedAt: Date;
}
