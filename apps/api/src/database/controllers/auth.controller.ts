import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

class ForgotPasswordRequest {
  email!: string;
}

class ResetPasswordRequest {
  token!: string;
  passwordHash!: string;
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

  @Post('forgot-password')
  async forgotPassword(
    @Body() body: ForgotPasswordRequest,
  ): Promise<{ message: string }> {
    if (!body.email?.trim()) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.requestPasswordReset(body.email);
  }

  @Get('reset-password/validate')
  async validateResetToken(
    @Query('token') token: string,
  ): Promise<{ valid: boolean }> {
    return this.authService.validateResetToken(token || '');
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: ResetPasswordRequest,
  ): Promise<{ message: string }> {
    const { token, passwordHash } = body;
    if (!token || !passwordHash) {
      throw new BadRequestException('Token and passwordHash are required');
    }
    return this.authService.resetPassword(token, passwordHash);
  }
}
