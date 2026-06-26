import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './entities/goal.entity';
import { GoalImage } from './entities/goal-image.entity';
import { GoalDescriptionBlock } from './entities/goal-description-block.entity';
import { GoalStep } from './entities/goal-step.entity';
import { FamilyService } from './family.service';
import { UploadService } from './upload.service';
import { isGoalStepStatus, getGoalStepStatusLabel } from './goal-step.constants';
import { PublicGoalStep, toPublicGoalStep } from './goal-step.mapper';
import { PublicGoal, toPublicGoal } from './goal.mapper';

export interface GoalGalleryImageInput {
  src: string;
  alt?: string;
}

export interface CreateGoalInput {
  title: string;
  short?: string;
  category?: string;
  horizon?: string;
  description?: string;
  gallery?: GoalGalleryImageInput[];
}

export type UpdateGoalInput = Partial<CreateGoalInput>;

export interface CreateGoalStepInput {
  comment: string;
  status: string;
  image?: string;
  imageAlt?: string;
}

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal) private readonly goals: Repository<Goal>,
    @InjectRepository(GoalImage) private readonly goalImages: Repository<GoalImage>,
    @InjectRepository(GoalDescriptionBlock)
    private readonly descriptionBlocks: Repository<GoalDescriptionBlock>,
    @InjectRepository(GoalStep) private readonly goalSteps: Repository<GoalStep>,
    private readonly familyService: FamilyService,
    private readonly uploadService: UploadService,
  ) {}

  async create(userId: string, input: CreateGoalInput): Promise<PublicGoal> {
    const title = input.title?.trim();
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    const membership = await this.familyService.findMemberByUserId(userId);
    if (!membership) {
      throw new NotFoundException('User is not a member of any family');
    }

    const gallery = this.normalizeGallery(input.gallery, title);
    const description = input.description?.trim() || '';
    const short =
      input.short?.trim()?.slice(0, 500) ||
      description.slice(0, 280) ||
      title.slice(0, 280);
    const first = gallery[0];

    const goal = await this.goals.save({
      familyId: membership.familyId,
      title: title.slice(0, 255),
      short,
      category: input.category?.trim()?.slice(0, 50) || null,
      horizon: input.horizon?.trim()?.slice(0, 50) || null,
      status: getGoalStepStatusLabel('spark'),
      ownersLabel: 'Вся семья',
      progress: 0,
      coverImage: first?.src || null,
      coverAlt: first?.alt || title,
      heroImage: first?.src || null,
      heroAlt: first?.alt || title,
      createdBy: userId,
    });

    if (gallery.length) {
      await this.goalImages.save(
        gallery.map((image, index) => ({
          goalId: goal.id,
          src: image.src,
          alt: image.alt ?? null,
          sortOrder: index,
        })),
      );
    }

    if (description) {
      await this.descriptionBlocks.save({
        goalId: goal.id,
        text: description,
        sortOrder: 0,
      });
    }

    return toPublicGoal(await this.loadGoalWithRelations(goal.id));
  }

  async update(userId: string, goalIdOrKey: string, input: UpdateGoalInput): Promise<PublicGoal> {
    const goal = await this.getGoalForUser(userId, goalIdOrKey);

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) {
        throw new BadRequestException('Title is required');
      }
      goal.title = title.slice(0, 255);
    }

    if (input.short !== undefined) {
      goal.short = input.short.trim()?.slice(0, 500) || null;
    }

    if (input.category !== undefined) {
      goal.category = input.category.trim()?.slice(0, 50) || null;
    }

    if (input.horizon !== undefined) {
      goal.horizon = input.horizon.trim()?.slice(0, 50) || null;
    }

    if (input.description !== undefined) {
      const text = input.description.trim();
      await this.descriptionBlocks.delete({ goalId: goal.id });
      if (text) {
        await this.descriptionBlocks.save({
          goalId: goal.id,
          text,
          sortOrder: 0,
        });
        if (input.short === undefined) {
          goal.short = text.slice(0, 280);
        }
      } else if (input.short === undefined) {
        goal.short = null;
      }
    }

    if (input.gallery !== undefined) {
      const gallery = this.normalizeGallery(input.gallery, goal.title);
      const oldUrls = (goal.images || [])
        .map((image) => image.src)
        .filter((src) => src.startsWith('/uploads/goals/'));

      await this.goalImages.delete({ goalId: goal.id });

      if (gallery.length) {
        await this.goalImages.save(
          gallery.map((image, index) => ({
            goalId: goal.id,
            src: image.src,
            alt: image.alt ?? null,
            sortOrder: index,
          })),
        );
      }

      const newUrls = new Set(gallery.map((image) => image.src));
      oldUrls
        .filter((url) => !newUrls.has(url))
        .forEach((url) => this.uploadService.deleteGoalImage(url));

      const first = gallery[0];
      goal.coverImage = first?.src || null;
      goal.coverAlt = first?.alt || goal.title;
      goal.heroImage = first?.src || null;
      goal.heroAlt = first?.alt || goal.title;
    }

    await this.goals.save(goal);
    return toPublicGoal(await this.loadGoalWithRelations(goal.id));
  }

  async remove(userId: string, goalIdOrKey: string): Promise<void> {
    const goal = await this.getGoalForUser(userId, goalIdOrKey);
    const urls = this.collectStoredImageUrls(goal);
    const steps = await this.goalSteps.find({ where: { goalId: goal.id } });
    steps.forEach((step) => {
      if (step.image?.startsWith('/uploads/goals/')) {
        urls.push(step.image);
      }
    });
    await this.goals.remove(goal);
    urls.forEach((url) => this.uploadService.deleteGoalImage(url));
  }

  async createStep(
    userId: string,
    goalIdOrKey: string,
    input: CreateGoalStepInput,
  ): Promise<PublicGoalStep> {
    const comment = input.comment?.trim();
    if (!comment) {
      throw new BadRequestException('Comment is required');
    }

    const status = input.status?.trim();
    if (!status || !isGoalStepStatus(status)) {
      throw new BadRequestException('Invalid step status');
    }

    const membership = await this.familyService.findMemberByUserId(userId);
    if (!membership) {
      throw new NotFoundException('User is not a member of any family');
    }

    const goal = await this.getGoalForUser(userId, goalIdOrKey);
    const image = input.image?.trim() || null;

    const stepCount = await this.goalSteps.count({ where: { goalId: goal.id } });
    const saved = await this.goalSteps.save({
      goalId: goal.id,
      userId,
      text: comment.slice(0, 500),
      status,
      image,
      imageAlt: input.imageAlt?.trim()?.slice(0, 255) || comment.slice(0, 255),
      sortOrder: stepCount,
    });

    goal.status = getGoalStepStatusLabel(status);
    await this.goals.save(goal);

    return toPublicGoalStep(saved, membership);
  }

  async removeStep(userId: string, goalIdOrKey: string, stepId: string): Promise<void> {
    const goal = await this.getGoalForUser(userId, goalIdOrKey);
    const step = await this.goalSteps.findOne({ where: { id: stepId, goalId: goal.id } });
    if (!step) {
      throw new NotFoundException('Step not found');
    }
    if (step.userId !== userId) {
      throw new BadRequestException('You can only delete your own steps');
    }

    this.uploadService.deleteGoalImage(step.image);
    await this.goalSteps.remove(step);
    await this.syncGoalStatusFromLatestStep(goal.id);
  }

  private async syncGoalStatusFromLatestStep(goalId: string): Promise<void> {
    const latest = await this.goalSteps.findOne({
      where: { goalId },
      order: { createdAt: 'DESC' },
    });
    const statusLabel = latest
      ? getGoalStepStatusLabel(latest.status)
      : getGoalStepStatusLabel('spark');
    await this.goals.update(goalId, { status: statusLabel });
  }

  private normalizeGallery(
    gallery: GoalGalleryImageInput[] | undefined,
    title: string,
  ): Array<{ src: string; alt: string }> {
    if (!gallery?.length) {
      return [];
    }

    const seen = new Set<string>();
    const normalized: Array<{ src: string; alt: string }> = [];

    for (const item of gallery) {
      const src = item.src?.trim();
      if (!src || seen.has(src)) {
        continue;
      }
      seen.add(src);
      normalized.push({
        src,
        alt: item.alt?.trim()?.slice(0, 255) || title.slice(0, 255),
      });
    }

    return normalized;
  }

  private async getGoalForUser(userId: string, goalIdOrKey: string): Promise<Goal> {
    const membership = await this.familyService.findMemberByUserId(userId);
    if (!membership) {
      throw new NotFoundException('User is not a member of any family');
    }

    const goal = await this.goals
      .createQueryBuilder('goal')
      .where('goal.family_id = :familyId', { familyId: membership.familyId })
      .andWhere('(goal.id::text = :goalId OR goal.legacy_key = :goalId)', { goalId: goalIdOrKey })
      .getOne();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    await this.attachGoalRelations(goal);
    return goal;
  }

  private async attachGoalRelations(goal: Goal): Promise<void> {
    const [images, descriptionBlocks] = await Promise.all([
      this.goalImages.find({
        where: { goalId: goal.id },
        order: { sortOrder: 'ASC' },
      }),
      this.descriptionBlocks.find({
        where: { goalId: goal.id },
        order: { sortOrder: 'ASC' },
      }),
    ]);
    goal.images = images;
    goal.descriptionBlocks = descriptionBlocks;
  }

  private async loadGoalWithRelations(goalId: string): Promise<Goal> {
    const goal = await this.goals.findOne({ where: { id: goalId } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    await this.attachGoalRelations(goal);
    return goal;
  }

  private collectStoredImageUrls(goal: Goal): string[] {
    const urls = new Set<string>();
    [goal.coverImage, goal.heroImage, ...(goal.images || []).map((image) => image.src)]
      .filter((src): src is string => Boolean(src?.startsWith('/uploads/goals/')))
      .forEach((src) => urls.add(src));
    return [...urls];
  }
}
