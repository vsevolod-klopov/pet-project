import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from './entities/family-member.entity';
import { Goal } from './entities/goal.entity';
import { GoalStep } from './entities/goal-step.entity';
import { Wish } from './entities/wish.entity';
import { FamilyService } from './family.service';
import { toPublicGoalStep } from './goal-step.mapper';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(FamilyMember) private readonly members: Repository<FamilyMember>,
    @InjectRepository(Goal) private readonly goals: Repository<Goal>,
    @InjectRepository(Wish) private readonly wishes: Repository<Wish>,
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
        relations: ['images', 'steps', 'tags', 'descriptionBlocks'],
        order: { createdAt: 'ASC' },
      }),
      this.wishes.find({
        where: { familyId, visibility: 'family' },
        order: { createdAt: 'ASC' },
      }),
    ]);

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
