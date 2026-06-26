import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GoalImage } from './goal-image.entity';
import { GoalStep } from './goal-step.entity';
import { GoalTag } from './goal-tag.entity';
import { GoalDescriptionBlock } from './goal-description-block.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  short?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  horizon?: string | null;

  @Column({ length: 50, default: 'В начале' })
  status!: string;

  @Column({ name: 'owners_label', length: 100, default: 'Вся семья' })
  ownersLabel!: string;

  @Column({ type: 'smallint', default: 0 })
  progress!: number;

  @Column({ name: 'cover_image', type: 'text', nullable: true })
  coverImage?: string | null;

  @Column({ name: 'cover_alt', type: 'varchar', length: 255, nullable: true })
  coverAlt?: string | null;

  @Column({ name: 'hero_image', type: 'text', nullable: true })
  heroImage?: string | null;

  @Column({ name: 'hero_alt', type: 'varchar', length: 255, nullable: true })
  heroAlt?: string | null;

  @Column({ type: 'text', nullable: true })
  feeling?: string | null;

  @Column({ name: 'legacy_key', type: 'varchar', length: 50, nullable: true })
  legacyKey?: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  images?: GoalImage[];

  steps?: GoalStep[];

  tags?: GoalTag[];

  descriptionBlocks?: GoalDescriptionBlock[];
}
