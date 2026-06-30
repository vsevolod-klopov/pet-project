import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UploadService } from '../../catalog/upload.service';
import { FamilyService } from '../../catalog/family.service';
import { UserService } from '../services/user.service';
import { JwtGuard } from '../guards/jwt.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { toPublicUser } from '../user.mapper';

interface AuthUserPayload {
  userId: string;
  email: string;
}

class UpdateProfileRequest {
  name?: string;
  avatarUrl?: string | null;
}

@Controller('api/user')
@UseGuards(JwtGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly familyService: FamilyService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('profile')
  async getProfile(@GetUser() authUser: AuthUserPayload) {
    const user = await this.userService.findById(authUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toPublicUser(user);
  }

  @Patch('profile')
  async updateProfile(
    @GetUser() authUser: AuthUserPayload,
    @Body() body: UpdateProfileRequest,
  ) {
    const user = await this.userService.findById(authUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: { name?: string; avatarUrl?: string | null } = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name || name.length > 100) {
        throw new BadRequestException('Name must be between 1 and 100 characters');
      }
      updateData.name = name;
    }

    if (body.avatarUrl !== undefined) {
      if (body.avatarUrl === null || body.avatarUrl === '') {
        updateData.avatarUrl = null;
      } else if (!body.avatarUrl.startsWith('/uploads/avatars/')) {
        throw new BadRequestException('Invalid avatar URL');
      } else {
        updateData.avatarUrl = body.avatarUrl;
      }
    }

    if (!Object.keys(updateData).length) {
      throw new BadRequestException('No valid fields to update');
    }

    if (updateData.avatarUrl !== undefined && user.avatarUrl !== updateData.avatarUrl) {
      this.uploadService.deleteAvatarImage(user.avatarUrl);
    }

    const updated = await this.userService.update(authUser.userId, updateData);
    if (!updated) {
      throw new NotFoundException('User not found');
    }

    if (updateData.name) {
      await this.familyService.syncMemberDisplayName(authUser.userId, updateData.name);
    }

    return toPublicUser(updated);
  }
}
