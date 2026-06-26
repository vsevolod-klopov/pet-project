import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FamilyService } from '../../catalog/family.service';
import {
  AuthService,
  type AuthResponse,
  type FamilyMode,
  type Tokens,
} from '../services/auth.service';

class LoginRequest {
  email!: string;
  passwordHash!: string;
}

class RegisterRequest {
  name!: string;
  email!: string;
  passwordHash!: string;
  familyMode!: FamilyMode;
  familyName?: string;
  inviteCode?: string;
}

class RefreshRequest {
  refreshToken!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly familyService: FamilyService,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterRequest): Promise<AuthResponse> {
    const { name, email, passwordHash, familyMode, familyName, inviteCode } = body;
    if (!name || !email || !passwordHash || !familyMode) {
      throw new BadRequestException(
        'Name, email, passwordHash and familyMode are required',
      );
    }

    return this.authService.register(name, email, passwordHash, familyMode, {
      familyName,
      inviteCode,
    });
  }

  @Get('invite/:code')
  async checkInvite(@Param('code') code: string) {
    return this.familyService.validateInviteCode(code);
  }

  @Post('login')
  async login(@Body() body: LoginRequest): Promise<AuthResponse> {
    const { email, passwordHash } = body;
    if (!email || !passwordHash) {
      throw new BadRequestException('Email and passwordHash are required');
    }

    return this.authService.login(email, passwordHash);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshRequest): Tokens {
    const { refreshToken } = body;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    return this.authService.refresh(refreshToken);
  }
}
