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

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  location: string;

  @Column({
    type: 'enum',
    enum: ['urgent', 'in_progress', 'resolved'],
    default: 'in_progress',
  })
  status: 'urgent' | 'in_progress' | 'resolved';

  @Column({ type: 'boolean', default: false })
  urgent: boolean;

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @ManyToOne(() => Resident, (resident) => resident.incidents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resident_id' })
  resident: Resident;

  @CreateDateColumn()
  reported_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'varchar', length: 100 })
  reported_by: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resolved_by: string;
}
