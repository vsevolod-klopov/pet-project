import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';
import { Goal } from './entities/goal.entity';
import { GoalImage } from './entities/goal-image.entity';
import { GoalStep } from './entities/goal-step.entity';
import { GoalTag } from './entities/goal-tag.entity';
import { GoalDescriptionBlock } from './entities/goal-description-block.entity';
import { Wish } from './entities/wish.entity';
import { FamilyInvite } from './entities/family-invite.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogSeedService } from './catalog-seed.service';
import { FamilyService } from './family.service';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';
import { UploadController, WishController } from './wish.controller';
import { UploadService } from './upload.service';
import { WishService } from './wish.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Family,
      FamilyMember,
      FamilyInvite,
      Goal,
      GoalImage,
      GoalStep,
      GoalTag,
      GoalDescriptionBlock,
      Wish,
    ]),
  ],
  controllers: [CatalogController, WishController, UploadController, GoalController],
  providers: [CatalogService, CatalogSeedService, FamilyService, WishService, GoalService, UploadService],
  exports: [FamilyService, CatalogService, WishService, GoalService, UploadService],
})
export class CatalogModule {}
