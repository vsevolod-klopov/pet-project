import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Goal } from './goal.entity';

@Entity('goal_description_blocks')
export class GoalDescriptionBlock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Goal, (goal) => goal.descriptionBlocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal!: Goal;
}
