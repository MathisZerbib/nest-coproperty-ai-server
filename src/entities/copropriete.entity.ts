import { ApiProperty } from '@nestjs/swagger'; // Added
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Resident } from './resident.entity';

@Entity()
export class Copropriete {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique ID of the copropriete',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Copropriete A',
    description: 'The name of the copropriete',
  })
  @Column()
  name: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'The address of the copropriete',
  })
  @Column()
  address: string;

  @ApiProperty({
    example: 'A beautiful copropriete',
    description: 'Description of the copropriete',
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    example: 10,
    description: 'The number of units in the copropriete',
  })
  @Column()
  units: number;

  @ApiProperty({ example: 'John Doe', description: 'The name of the advisor' })
  @Column({ nullable: true })
  advisor_name: string;

  @ApiProperty({
    example: 'advisor@example.com',
    description: 'The email of the advisor',
  })
  @Column({ nullable: true })
  advisor_email: string;

  @ApiProperty({
    example: '+123456789',
    description: 'The phone number of the advisor',
  })
  @Column({ nullable: true })
  advisor_phone: string;

  @ApiProperty({
    type: () => User,
    description: 'The user associated with the copropriete',
  })
  @ManyToOne(() => User, (user) => user.coproprietes, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({
    type: () => [Resident],
    description: 'The residents of the copropriete',
  })
  @OneToMany(() => Resident, (resident) => resident.coproperty)
  residents: Resident[];

  @ApiProperty({
    example: '2025-05-01T12:00:00.000Z',
    description: 'Date when the copropriete was created',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    example: '2025-05-02T12:00:00.000Z',
    description: 'Date when the copropriete was last updated',
  })
  @UpdateDateColumn()
  updated_at: Date;
}
