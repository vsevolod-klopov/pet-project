import { FamilyMember } from './entities/family-member.entity';
import { GoalStep } from './entities/goal-step.entity';
import { getGoalStepStatusLabel } from './goal-step.constants';

export interface PublicGoalStep {
  id: string;
  authorId: string | null;
  authorName: string;
  authorInitials: string;
  authorGradient: string;
  comment: string;
  status: string;
  statusLabel: string;
  image: string | null;
  imageAlt: string | null;
  createdAt: string;
}

export function toPublicGoalStep(
  step: GoalStep,
  member?: FamilyMember | null,
): PublicGoalStep {
  return {
    id: step.id,
    authorId: step.userId ?? null,
    authorName: member?.displayName ?? 'Семья',
    authorInitials: member?.initials ?? '??',
    authorGradient: member?.gradient ?? 'base',
    comment: step.text,
    status: step.status,
    statusLabel: getGoalStepStatusLabel(step.status),
    image: step.image ?? null,
    imageAlt: step.imageAlt ?? null,
    createdAt: (step.createdAt ?? new Date()).toISOString(),
  };
}
