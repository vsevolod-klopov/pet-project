export const GOAL_STEP_STATUS_IDS = ['spark', 'plan', 'doing', 'done', 'celebrate'] as const;

export type GoalStepStatusId = (typeof GOAL_STEP_STATUS_IDS)[number];

export const GOAL_STEP_STATUSES: Array<{ id: GoalStepStatusId; label: string }> = [
  { id: 'spark', label: 'Зарождается' },
  { id: 'plan', label: 'Планируем' },
  { id: 'doing', label: 'В процессе' },
  { id: 'done', label: 'Сделано' },
  { id: 'celebrate', label: 'Празднуем' },
];

export function getGoalStepStatusLabel(status?: string | null): string {
  const found = GOAL_STEP_STATUSES.find((item) => item.id === status);
  return found?.label ?? GOAL_STEP_STATUSES[0].label;
}

export function isGoalStepStatus(value: string): value is GoalStepStatusId {
  return (GOAL_STEP_STATUS_IDS as readonly string[]).includes(value);
}
