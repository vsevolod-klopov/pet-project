import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import { JwtGuard } from '../database/guards/jwt.guard';
import { CatalogService } from './catalog.service';
import { FamilyService } from './family.service';

interface AuthUser {
  userId: string;
  email: string;
}

@Controller('api')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly familyService: FamilyService,
  ) {}

  @Get('data')
  @UseGuards(JwtGuard)
  getData(@GetUser() user: AuthUser) {
    return this.catalogService.getAppData(user.userId);
  }

  @Get('family/invite')
  @UseGuards(JwtGuard)
  getFamilyInvite(@GetUser() user: AuthUser) {
    return this.familyService.getFamilyInviteForUser(user.userId);
  }
}
