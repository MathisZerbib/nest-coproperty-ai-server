import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Resident } from './resident.entity';

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

  @OneToMany(() => Resident, (resident) => resident.coproperty)
  residents: Resident[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
