import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Column({ type: 'varchar', length: 100 })
  reportedBy: string;

  @Column({ type: 'boolean', default: false })
  urgent: boolean;

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @ManyToOne(() => Resident, (resident) => resident.incidents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  resident: Resident;

  @CreateDateColumn()
  reportedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
