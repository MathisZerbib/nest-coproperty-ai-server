import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Incident } from './incidents.entity';
import { Copropriete } from './copropriete.entity';

@Entity('residents')
export class Resident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'firstName', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'lastName', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'email', type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'phone', type: 'varchar', length: 15, nullable: true })
  phone: string;

  @Column({ name: 'apartment', type: 'varchar', length: 50 })
  apartment: string;

  @Column({
    name: 'profileImage',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  profileImage: string;

  @OneToMany(() => Incident, (incident) => incident.resident)
  incidents: Incident[];

  @ManyToOne(() => Copropriete, (coproperty) => coproperty.residents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'copropertyId' }) // Use camelCase for column name
  coproperty: Copropriete;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['owner', 'tenant', 'both'],
    default: 'tenant',
  })
  status: 'owner' | 'tenant' | 'both';

  @Column({ name: 'moveInDate', type: 'date', nullable: true }) // Updated camelCase
  moveInDate: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'createdAt' }) // camelCase for consistency
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' }) // camelCase for consistency
  updatedAt: Date;
}
