import { ApiProperty } from '@nestjs/swagger'; // Added
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Messages } from './messages.entity';

@Entity()
export class Conversation {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique ID of the conversation',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '456e7890-e12b-34d5-f678-526714174111',
    description: 'ID of the associated copropriety',
  })
  @Column({ nullable: true })
  copropriety_id: string;

  @ApiProperty({
    example: 'General Discussion',
    description: 'Title of the conversation',
  })
  @Column()
  title: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the user who created the conversation',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    type: () => [Messages],
    description: 'List of messages in the conversation',
  })
  @OneToMany(() => Messages, (messages) => messages.conversation, {
    cascade: true,
  })
  messages: Messages[];

  @ApiProperty({
    example: '2025-05-01T12:00:00.000Z',
    description: 'Date when the conversation was created',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    example: '2025-05-02T12:00:00.000Z',
    description: 'Date when the conversation was last updated',
  })
  @UpdateDateColumn()
  updated_at: Date;
}
