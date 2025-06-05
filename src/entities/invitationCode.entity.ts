// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
// } from 'typeorm';
// import { Copropriete } from './copropriete.entity';

// @Entity()
// export class InvitationCode {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({
//     unique: true,
//   })
//   code: string;

//   @ManyToOne(() => Copropriete, (copropriete) => copropriete.invitationCodes)
//   copropriete: Copropriete;

//   @Column({ default: false })
//   isUsed: boolean;

//   @CreateDateColumn()
//   createdAt: Date;

//   // We could add an expiration date here if needed,
//   // but the current requirement is to expire after usage.
//   // @Column()
//   // expiresAt: Date;
// }
