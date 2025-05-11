import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Assembly } from './assembly.entity';

@Entity('attendees')
export class Attendee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  assembly_id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['owner', 'tenant', 'representative'],
  })
  role: 'owner' | 'tenant' | 'representative';

  @Column()
  present: boolean;

  @Column({ nullable: true })
  proxy_name: string;

  @Column({ nullable: true })
  proxy_document: string;

  @ManyToOne(() => Assembly, (assembly) => assembly.attendees)
  assembly: Assembly;
}
