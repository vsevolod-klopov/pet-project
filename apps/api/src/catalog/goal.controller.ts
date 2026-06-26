import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import { JwtGuard } from '../database/guards/jwt.guard';
import {
  CreateGoalInput,
  CreateGoalStepInput,
  GoalService,
  UpdateGoalInput,
} from './goal.service';

interface AuthUser {
  userId: string;
  email: string;
}

class CreateGoalRequest implements CreateGoalInput {
  title!: string;
  short?: string;
  category?: string;
  horizon?: string;
  description?: string;
  gallery?: Array<{ src: string; alt?: string }>;
}

class UpdateGoalRequest implements UpdateGoalInput {
  title?: string;
  short?: string;
  category?: string;
  horizon?: string;
  description?: string;
  gallery?: Array<{ src: string; alt?: string }>;
}

class CreateGoalStepRequest implements CreateGoalStepInput {
  comment!: string;
  status!: string;
  image?: string;
  imageAlt?: string;
}

@Controller('api/goals')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@GetUser() user: AuthUser, @Body() body: CreateGoalRequest) {
    return this.goalService.create(user.userId, body);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(
    @GetUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateGoalRequest,
  ) {
    return this.goalService.update(user.userId, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async remove(@GetUser() user: AuthUser, @Param('id') id: string) {
    await this.goalService.remove(user.userId, id);
    return { ok: true };
  }

  @Post(':id/steps')
  @UseGuards(JwtGuard)
  createStep(
    @GetUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateGoalStepRequest,
  ) {
    return this.goalService.createStep(user.userId, id, body);
  }

  @Delete(':goalId/steps/:stepId')
  @UseGuards(JwtGuard)
  async removeStep(
    @GetUser() user: AuthUser,
    @Param('goalId') goalId: string,
    @Param('stepId') stepId: string,
  ) {
    await this.goalService.removeStep(user.userId, goalId, stepId);
    return { ok: true };
  }
}
