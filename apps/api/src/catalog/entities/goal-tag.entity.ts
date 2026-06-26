import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('goal_tags')
export class GoalTag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId!: string;

  @Column({ length: 50 })
  tag!: string;
}
