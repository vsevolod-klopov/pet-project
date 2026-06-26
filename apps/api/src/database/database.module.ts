import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserModule } from './user.module';
import { CatalogModule } from '../catalog/catalog.module';
import { Family } from '../catalog/entities/family.entity';
import { FamilyMember } from '../catalog/entities/family-member.entity';
import { Goal } from '../catalog/entities/goal.entity';
import { GoalImage } from '../catalog/entities/goal-image.entity';
import { GoalStep } from '../catalog/entities/goal-step.entity';
import { GoalTag } from '../catalog/entities/goal-tag.entity';
import { GoalDescriptionBlock } from '../catalog/entities/goal-description-block.entity';
import { Wish } from '../catalog/entities/wish.entity';
import { FamilyInvite } from '../catalog/entities/family-invite.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.DATABASE_URL ||
        'postgresql://pet:pet@localhost:5432/pet_db',
      entities: [
        User,
        Family,
        FamilyMember,
        Goal,
        GoalImage,
        GoalStep,
        GoalTag,
        GoalDescriptionBlock,
        Wish,
        FamilyInvite,
      ],
      synchronize: false,
    }),
    UserModule,
    CatalogModule,
  ],
})
export class DatabaseModule {}
