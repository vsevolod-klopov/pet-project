import { Goal } from './entities/goal.entity';

export interface PublicGoalGalleryImage {
  src: string;
  alt: string | null;
}

export interface PublicGoal {
  id: string;
  title: string;
  short: string | null;
  category: string | null;
  horizon: string | null;
  status: string;
  owners: string;
  progress: number;
  coverImage: string | null;
  coverAlt: string | null;
  heroImage: string | null;
  heroAlt: string | null;
  feeling: string | null;
  gallery: PublicGoalGalleryImage[];
  description: string[];
}

export function toPublicGoal(goal: Goal): PublicGoal {
  return {
    id: goal.legacyKey || goal.id,
    title: goal.title,
    short: goal.short ?? null,
    category: goal.category ?? null,
    horizon: goal.horizon ?? null,
    status: goal.status,
    owners: goal.ownersLabel,
    progress: goal.progress,
    coverImage: goal.coverImage ?? null,
    coverAlt: goal.coverAlt ?? null,
    heroImage: goal.heroImage ?? null,
    heroAlt: goal.heroAlt ?? null,
    feeling: goal.feeling ?? null,
    gallery: [...(goal.images || [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => ({
        src: image.src,
        alt: image.alt ?? null,
      })),
    description: [...(goal.descriptionBlocks || [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((block) => block.text),
  };
}
