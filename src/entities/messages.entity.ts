import { ApiProperty } from '@nestjs/swagger'; // Added
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity()
export class Messages {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique ID of the message',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => Conversation,
    description: 'The conversation this message belongs to',
  })
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  conversation: Conversation;

  @ApiProperty({
    example: 'Hello, how can I help you?',
    description: 'Content of the message',
  })
  @Column()
  content: string;

  @ApiProperty({
    example: '456e7890-e12b-34d5-f678-526714174111',
    description: 'ID of the user who sent the message',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    example: '2025-05-01T12:00:00.000Z',
    description: 'Date when the message was created',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    example: '2025-05-02T12:00:00.000Z',
    description: 'Date when the message was last updated',
  })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({
    example: 1,
    description: 'Sequence number of the message in the conversation',
  })
  @Column({ default: 0 })
  sequence_number: number;

  @ApiProperty({
    example: 'user',
    description: 'Role of the sender (e.g., user or assistant)',
  })
  @Column({ default: 'user' })
  role: string;
}
