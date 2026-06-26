import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wish } from './entities/wish.entity';
import { FamilyService } from './family.service';
import { UploadService } from './upload.service';
import { PublicWish, toPublicWish } from './wish.mapper';

export interface CreateWishInput {
  title: string;
  description?: string;
  category?: string;
  budget?: string;
  link?: string;
  image?: string;
  alt?: string;
  visibility?: 'private' | 'family';
}

export type UpdateWishInput = Partial<CreateWishInput>;

@Injectable()
export class WishService {
  constructor(
    @InjectRepository(Wish) private readonly wishes: Repository<Wish>,
    private readonly familyService: FamilyService,
    private readonly uploadService: UploadService,
  ) {}

  async findMine(userId: string): Promise<PublicWish[]> {
    const rows = await this.wishes.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toPublicWish);
  }

  async create(userId: string, input: CreateWishInput): Promise<PublicWish> {
    const title = input.title?.trim();
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    const membership = await this.familyService.findMemberByUserId(userId);
    if (!membership) {
      throw new NotFoundException('User is not a member of any family');
    }

    const visibility = input.visibility === 'family' ? 'family' : 'private';
    const image = input.image?.trim() || null;

    const wish = await this.wishes.save({
      userId,
      familyId: membership.familyId,
      title: title.slice(0, 255),
      description: input.description?.trim() || null,
      category: input.category?.trim()?.slice(0, 50) || null,
      budget: input.budget?.trim()?.slice(0, 50) || null,
      link: input.link?.trim() || null,
      image,
      alt: input.alt?.trim()?.slice(0, 255) || title.slice(0, 255),
      visibility,
      status: 'wanted',
    });

    return toPublicWish(wish);
  }

  async update(userId: string, wishId: string, input: UpdateWishInput): Promise<PublicWish> {
    const wish = await this.wishes.findOne({ where: { id: wishId } });
    if (!wish) {
      throw new NotFoundException('Wish not found');
    }
    if (wish.userId !== userId) {
      throw new ForbiddenException('You can only edit your own wishes');
    }

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) {
        throw new BadRequestException('Title is required');
      }
      wish.title = title.slice(0, 255);
    }

    if (input.description !== undefined) {
      wish.description = input.description.trim() || null;
    }
    if (input.category !== undefined) {
      wish.category = input.category.trim()?.slice(0, 50) || null;
    }
    if (input.budget !== undefined) {
      wish.budget = input.budget.trim()?.slice(0, 50) || null;
    }
    if (input.link !== undefined) {
      wish.link = input.link.trim() || null;
    }
    if (input.alt !== undefined) {
      wish.alt = input.alt.trim()?.slice(0, 255) || wish.title;
    }
    if (input.visibility !== undefined) {
      wish.visibility = input.visibility === 'family' ? 'family' : 'private';
    }
    if (input.image !== undefined) {
      const nextImage = input.image.trim() || null;
      if (wish.image && wish.image !== nextImage) {
        this.uploadService.deleteWishImage(wish.image);
      }
      wish.image = nextImage;
    }

    const saved = await this.wishes.save(wish);
    return toPublicWish(saved);
  }

  async remove(userId: string, wishId: string): Promise<void> {
    const wish = await this.wishes.findOne({ where: { id: wishId } });
    if (!wish) {
      throw new NotFoundException('Wish not found');
    }
    if (wish.userId !== userId) {
      throw new ForbiddenException('You can only delete your own wishes');
    }

    this.uploadService.deleteWishImage(wish.image);
    await this.wishes.remove(wish);
  }
}
