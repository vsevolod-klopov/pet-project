import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wishes')
export class Wish {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'family_id', type: 'uuid', nullable: true })
  familyId?: string | null;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  budget?: string | null;

  @Column({ type: 'text', nullable: true })
  link?: string | null;

  @Column({ type: 'text', nullable: true })
  image?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alt?: string | null;

  @Column({ length: 20, default: 'wanted' })
  status!: string;

  @Column({ name: 'legacy_key', type: 'varchar', length: 50, nullable: true })
  legacyKey?: string | null;

  @Column({ length: 20, default: 'family' })
  visibility!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
