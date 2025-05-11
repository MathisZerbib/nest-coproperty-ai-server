import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { AgendaItem } from './agenda-item.entity';
import { Decision } from './decision.entity';
import { AssemblyDocument } from './assembly-document.entity';
import { Attendee } from './attendee.entity';

@Entity('assemblies')
export class Assembly {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  date: Date;

  @Column({
    type: 'enum',
    enum: ['ordinary', 'extraordinary'],
  })
  type: 'ordinary' | 'extraordinary';

  @Column({
    type: 'enum',
    enum: ['upcoming', 'completed', 'cancelled'],
  })
  status: 'upcoming' | 'completed' | 'cancelled';

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, type: 'text' })
  minutes: string;

  @Column()
  copropriety_id: string;

  @OneToMany(() => AgendaItem, (agendaItem) => agendaItem.assembly)
  agenda: AgendaItem[];

  @OneToMany(() => Decision, (decision) => decision.assembly)
  decisions: Decision[];

  @OneToMany(() => AssemblyDocument, (document) => document.assembly)
  documents: AssemblyDocument[];

  @OneToMany(() => Attendee, (attendee) => attendee.assembly)
  attendees: Attendee[];
}
