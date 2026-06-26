import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('goal_steps')
export class GoalStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @Column({ length: 500 })
  text!: string;

  @Column({ length: 50, default: 'spark' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  image?: string | null;

  @Column({ name: 'image_alt', type: 'varchar', length: 255, nullable: true })
  imageAlt?: string | null;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_done', default: false })
  isDone!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
