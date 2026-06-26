import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('goal_images')
export class GoalImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId!: string;

  @Column({ type: 'text' })
  src!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alt?: string | null;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;
}
