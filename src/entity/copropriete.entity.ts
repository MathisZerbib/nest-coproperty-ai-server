import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Copropriete {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  units: number;

  @Column({ nullable: true })
  advisor_name: string;

  @Column({ nullable: true })
  advisor_email: string;

  @Column({ nullable: true })
  advisor_phone: string;

  @ManyToOne(() => User, (user) => user.coproprietes, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
