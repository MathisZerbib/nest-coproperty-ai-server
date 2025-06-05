import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger'; // Added
import { RefreshToken } from './refresh-token.entity';
import { Copropriete } from './copropriete.entity';
import { Resident } from './resident.entity';

@Entity()
export class User {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique ID of the user',
  })
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email of the user',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'username123', description: 'Username of the user' })
  @Column()
  username: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number of the user',
  })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ example: '123 Main St', description: 'Address of the user' })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({
    example: 'hashedpassword',
    description: 'Password of the user',
  })
  @Column()
  password: string;

  @ApiProperty({
    example: 'user',
    description: 'Role of the user (e.g., user, admin)',
    default: 'user',
  })
  @Column({ default: 'user' })
  role: string;

  @ApiProperty({
    example: '123456789',
    description: 'Google ID of the user',
  })
  @Column({ nullable: true })
  googleId: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'Profile picture URL of the user',
  })
  @Column({ nullable: true })
  profilePicture: string;

  @ApiProperty({
    type: () => [RefreshToken],
    description: 'List of refresh tokens associated with the user',
  })
  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @ApiProperty({
    type: () => [Resident],
    description: 'Residents associated with the user',
  })
  @OneToMany(() => Resident, (resident) => resident.user)
  residents: Resident[];

  @ApiProperty({
    type: () => [Copropriete],
    description: 'Coproprietes associated with the user',
  })
  @OneToMany(() => Copropriete, (copropriete) => copropriete.user)
  coproprietes: Copropriete[];

  @ApiProperty({
    example: '2025-05-01T12:00:00.000Z',
    description: 'Date when the user was created',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    example: '2025-05-02T12:00:00.000Z',
    description: 'Date when the user was last updated',
  })
  @UpdateDateColumn()
  updated_at: Date;
}
