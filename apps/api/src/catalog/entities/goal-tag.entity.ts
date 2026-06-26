import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Goal } from './goal.entity';

@Entity('goal_tags')
export class GoalTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId!: string;

  @Column({ length: 50 })
  tag!: string;

  @ManyToOne(() => Goal, (goal) => goal.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal!: Goal;
}
