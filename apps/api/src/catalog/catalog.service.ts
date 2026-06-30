import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FamilyMember } from './entities/family-member.entity';
import { Goal } from './entities/goal.entity';
import { GoalDescriptionBlock } from './entities/goal-description-block.entity';
import { GoalImage } from './entities/goal-image.entity';
import { GoalStep } from './entities/goal-step.entity';
import { GoalTag } from './entities/goal-tag.entity';
import { Wish } from './entities/wish.entity';
import { User } from '../database/entities/user.entity';
import { FamilyService } from './family.service';
import { toPublicGoalStep } from './goal-step.mapper';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(FamilyMember) private readonly members: Repository<FamilyMember>,
    @InjectRepository(Goal) private readonly goals: Repository<Goal>,
    @InjectRepository(GoalImage) private readonly goalImages: Repository<GoalImage>,
    @InjectRepository(GoalStep) private readonly goalSteps: Repository<GoalStep>,
    @InjectRepository(GoalTag) private readonly goalTags: Repository<GoalTag>,
    @InjectRepository(GoalDescriptionBlock)
    private readonly goalDescriptions: Repository<GoalDescriptionBlock>,
    @InjectRepository(Wish) private readonly wishes: Repository<Wish>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly familyService: FamilyService,
  ) {}

  async getAppData(userId: string) {
    const membership = await this.familyService.findMemberByUserId(userId);
    if (!membership) {
      throw new NotFoundException('User is not a member of any family');
    }

    const familyId = membership.familyId;

    const [members, goals, wishes] = await Promise.all([
      this.members.find({
        where: { familyId },
        order: { displayName: 'ASC' },
      }),
      this.goals.find({
        where: { familyId },
        order: { createdAt: 'ASC' },
      }),
      this.wishes.find({
        where: { familyId, visibility: 'family' },
        order: { createdAt: 'ASC' },
      }),
    ]);

    const goalIds = goals.map((goal) => goal.id);
    if (goalIds.length) {
      const [images, steps, tags, descriptionBlocks] = await Promise.all([
        this.goalImages.find({
          where: { goalId: In(goalIds) },
          order: { sortOrder: 'ASC' },
        }),
        this.goalSteps.find({
          where: { goalId: In(goalIds) },
          order: { sortOrder: 'ASC' },
        }),
        this.goalTags.find({
          where: { goalId: In(goalIds) },
        }),
        this.goalDescriptions.find({
          where: { goalId: In(goalIds) },
          order: { sortOrder: 'ASC' },
        }),
      ]);

      const imagesByGoal = new Map<string, GoalImage[]>();
      const stepsByGoal = new Map<string, GoalStep[]>();
      const tagsByGoal = new Map<string, GoalTag[]>();
      const blocksByGoal = new Map<string, GoalDescriptionBlock[]>();

      for (const image of images) {
        const list = imagesByGoal.get(image.goalId) ?? [];
        list.push(image);
        imagesByGoal.set(image.goalId, list);
      }
      for (const step of steps) {
        const list = stepsByGoal.get(step.goalId) ?? [];
        list.push(step);
        stepsByGoal.set(step.goalId, list);
      }
      for (const tag of tags) {
        const list = tagsByGoal.get(tag.goalId) ?? [];
        list.push(tag);
        tagsByGoal.set(tag.goalId, list);
      }
      for (const block of descriptionBlocks) {
        const list = blocksByGoal.get(block.goalId) ?? [];
        list.push(block);
        blocksByGoal.set(block.goalId, list);
      }

      for (const goal of goals) {
        goal.images = imagesByGoal.get(goal.id) ?? [];
        goal.steps = stepsByGoal.get(goal.id) ?? [];
        goal.tags = tagsByGoal.get(goal.id) ?? [];
        goal.descriptionBlocks = blocksByGoal.get(goal.id) ?? [];
      }
    }

    const wishlists: Record<string, unknown[]> = {};
    for (const member of members) {
      const key = member.legacyKey || member.id;
      wishlists[key] = wishes
        .filter((wish) => wish.userId === member.userId)
        .map((wish) => ({
          id: wish.legacyKey || wish.id,
          title: wish.title,
          description: wish.description,
          category: wish.category,
          budget: wish.budget,
          link: wish.link,
          image: wish.image,
          alt: wish.alt,
        }));
    }

    const membersByUserId = new Map(members.map((member) => [member.userId, member]));

    const userIds = members.map((member) => member.userId);
    const users = userIds.length
      ? await this.users.find({
          where: { id: In(userIds) },
          select: ['id', 'avatarUrl'],
        })
      : [];
    const avatarByUserId = new Map(
      users.map((user) => [user.id, user.avatarUrl ?? null]),
    );

    return {
      goals: goals.map((goal) => ({
        id: goal.legacyKey || goal.id,
        title: goal.title,
        short: goal.short,
        category: goal.category,
        horizon: goal.horizon,
        status: goal.status,
        owners: goal.ownersLabel,
        coverImage: goal.coverImage,
        coverAlt: goal.coverAlt,
        heroImage: goal.heroImage,
        heroAlt: goal.heroAlt,
        gallery: [...(goal.images || [])]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((image) => ({
            src: image.src,
            alt: image.alt,
          })),
        description: [...(goal.descriptionBlocks || [])]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((block) => block.text),
        steps: this.mapGoalSteps(goal.steps, membersByUserId),
      })),
      family: members.map((member) => ({
        id: member.legacyKey || member.id,
        userId: member.userId,
        name: member.displayName,
        initials: member.initials,
        gradient: member.gradient,
        subtitle: member.subtitle,
        description: member.description,
        avatarUrl: avatarByUserId.get(member.userId) ?? null,
      })),
      wishlists,
    };
  }

  private mapGoalSteps(
    steps: GoalStep[] | undefined,
    membersByUserId: Map<string, FamilyMember>,
  ) {
    return [...(steps || [])]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : a.sortOrder;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : b.sortOrder;
        return aTime - bTime;
      })
      .map((step) =>
        toPublicGoalStep(step, step.userId ? membersByUserId.get(step.userId) : null),
      );
  }
}
