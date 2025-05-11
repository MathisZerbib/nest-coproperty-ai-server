import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Decision } from './decision.entity';

@Entity('voters')
export class Voter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  decision_id: string;

  @Column()
  attendee_id: string;

  @Column({
    type: 'enum',
    enum: ['for', 'against', 'abstention'],
  })
  vote: 'for' | 'against' | 'abstention';

  @ManyToOne(() => Decision, (decision) => decision.voters)
  decision: Decision;
}
