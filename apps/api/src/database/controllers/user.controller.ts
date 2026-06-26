import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { JwtGuard } from '../guards/jwt.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { toPublicUser } from '../user.mapper';

interface AuthUserPayload {
  userId: string;
  email: string;
}

@Controller('api/user')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@GetUser() authUser: AuthUserPayload) {
    const user = await this.userService.findById(authUser.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toPublicUser(user);
  }
}
