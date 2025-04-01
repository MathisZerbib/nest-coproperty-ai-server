import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from '../../auth/refresh-token.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true }) // Allow null values for phone
  phone: string;

  @Column({ nullable: true }) // Allow null values for address
  address: string;

  @Column({ default: 'user' }) // Default role is 'user'
  role: string;

  @CreateDateColumn() // Automatically set when the entity is created
  created_at: Date;

  @UpdateDateColumn() // Automatically updated when the entity is updated
  updated_at: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];
}
