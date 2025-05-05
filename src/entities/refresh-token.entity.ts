import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger'; // Added
import { User } from './user.entity';

@Entity()
export class RefreshToken {
  @ApiProperty({ example: 1, description: 'Unique ID of the refresh token' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'randomly-generated-token',
    description: 'The token string',
  })
  @Column()
  token: string;

  @ApiProperty({
    type: () => User,
    description: 'The user associated with this token',
  })
  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user: User;

  @ApiProperty({
    example: '2025-05-01T12:00:00.000Z',
    description: 'The date when the token was created',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2025-05-08T12:00:00.000Z',
    description: 'The expiration date of the token',
  })
  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;
}
