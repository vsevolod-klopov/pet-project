import { Wish } from './entities/wish.entity';

export interface PublicWish {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget: string | null;
  link: string | null;
  image: string | null;
  alt: string | null;
  visibility: 'private' | 'family';
  status: string;
  createdAt: string;
}

export function toPublicWish(wish: Wish): PublicWish {
  return {
    id: wish.id,
    title: wish.title,
    description: wish.description ?? null,
    category: wish.category ?? null,
    budget: wish.budget ?? null,
    link: wish.link ?? null,
    image: wish.image ?? null,
    alt: wish.alt ?? null,
    visibility: wish.visibility as 'private' | 'family',
    status: wish.status,
    createdAt: wish.createdAt.toISOString(),
  };
}
