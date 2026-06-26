import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('family_members')
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'display_name', length: 100 })
  displayName!: string;

  @Column({ length: 4 })
  initials!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ length: 10, default: 'base' })
  gradient!: string;

  @Column({ length: 20, default: 'member' })
  role!: string;

  @Column({ name: 'legacy_key', type: 'varchar', length: 50, nullable: true })
  legacyKey?: string | null;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt!: Date;
}
