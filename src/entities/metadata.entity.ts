import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('metadata')
export class Metadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  docId: string;

  @Column()
  fileUrl: string;

  @Column()
  type: string;

  @Column({ type: 'uuid' })
  userId: string;
}
