import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { Copropriete } from './copropriete.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid') // Use UUID for globally unique IDs
  userId: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn() // Automatically set when the entity is created
  created_at: Date;

  @UpdateDateColumn() // Automatically updated when the entity is updated
  updated_at: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => Copropriete, (copropriete) => copropriete.user)
  coproprietes: Copropriete[]; // Relationship with Copropriete
}
