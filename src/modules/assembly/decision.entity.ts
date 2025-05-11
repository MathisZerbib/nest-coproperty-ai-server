import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Assembly } from './assembly.entity';
import { Voter } from './voter.entity';

@Entity('decisions')
export class Decision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  assembly_id: string;

  @Column()
  agenda_item_id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ['approved', 'rejected', 'postponed'],
  })
  result: 'approved' | 'rejected' | 'postponed';

  @Column()
  votes_for: number;

  @Column()
  votes_against: number;

  @Column()
  abstentions: number;

  @ManyToOne(() => Assembly, (assembly) => assembly.decisions)
  assembly: Assembly;

  @OneToMany(() => Voter, (voter) => voter.decision)
  voters: Voter[];
}
