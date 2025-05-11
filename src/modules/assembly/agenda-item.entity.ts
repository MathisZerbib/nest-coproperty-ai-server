import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Assembly } from './assembly.entity';

@Entity('agenda_items')
export class AgendaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  assembly_id: string;

  @Column()
  order: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  requires_vote: boolean;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'postponed'],
    default: 'pending',
  })
  status: 'pending' | 'approved' | 'rejected' | 'postponed';

  @ManyToOne(() => Assembly, (assembly) => assembly.agenda)
  assembly: Assembly;
}
