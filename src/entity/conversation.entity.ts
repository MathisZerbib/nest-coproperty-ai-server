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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  copropriety_id: string;

  @Column()
  title: string;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToMany(() => Messages, (messages) => messages.userId)
  messages: Messages[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
