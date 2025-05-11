import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Assembly } from './assembly.entity';

@Entity('assembly_documents')
export class AssemblyDocument {
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
    enum: ['pdf', 'docx', 'txt', 'image'],
  })
  type: 'pdf' | 'docx' | 'txt' | 'image';

  @Column()
  url: string;

  @Column()
  uploaded_by: string;

  @ManyToOne(() => Assembly, (assembly) => assembly.documents)
  assembly: Assembly;
}
