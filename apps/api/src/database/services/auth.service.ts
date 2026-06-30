import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { FamilyService } from '../../catalog/family.service';
import { MailService } from '../../mail/mail.service';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { User } from '../entities/user.entity';
import { toPublicUser, PublicUser } from '../user.mapper';
import { UserService } from './user.service';

export type FamilyMode = 'create' | 'join';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';
const RESET_TOKEN_TTL_MIN = Number(process.env.RESET_TOKEN_TTL_MIN || 60);

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function getPublicAppUrl(): string {
  const domain = process.env.DOMAIN?.trim();
  if (domain && domain !== 'example.com') {
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${domain}`;
  }
  return (process.env.PUBLIC_APP_URL || 'http://localhost:8080').replace(/\/$/, '');
}

interface TokenPayload {
  email: string;
  userId: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthFamilyInfo {
  id: string;
  name: string;
  role: 'owner' | 'member';
  inviteCode?: string;
}

export interface AuthResponse extends Tokens {
  user: PublicUser;
  family?: AuthFamilyInfo;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly familyService: FamilyService,
    private readonly mailService: MailService,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
  ) {}

  private generateTokens(payload: TokenPayload): Tokens {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
    return { accessToken, refreshToken };
  }

  private buildAuthResponse(user: User): AuthResponse {
    const tokens = this.generateTokens({ email: user.email, userId: user.id });
    return {
      ...tokens,
      user: toPublicUser(user),
    };
  }

  async validateUser(email: string, passwordHash: string) {
    const user = await this.userService.findByEmail(email);
    if (!user || user.passwordHash !== passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  async register(
    name: string,
    email: string,
    passwordHash: string,
    familyMode: FamilyMode,
    options: { familyName?: string; inviteCode?: string } = {},
  ): Promise<AuthResponse> {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (familyMode !== 'create' && familyMode !== 'join') {
      throw new BadRequestException('familyMode must be "create" or "join"');
    }

    const user = await this.userService.create({ name, email, passwordHash });

    let familyInfo: AuthFamilyInfo;
    if (familyMode === 'create') {
      const created = await this.familyService.createFamilyForUser(user, options.familyName);
      familyInfo = {
        id: created.familyId,
        name: created.familyName,
        role: created.role,
        inviteCode: created.inviteCode,
      };
    } else {
      if (!options.inviteCode?.trim()) {
        throw new BadRequestException('inviteCode is required to join a family');
      }
      const joined = await this.familyService.joinFamilyByCode(user, options.inviteCode);
      familyInfo = {
        id: joined.familyId,
        name: joined.familyName,
        role: joined.role,
      };
    }

    return {
      ...this.buildAuthResponse(user),
      family: familyInfo,
    };
  }

  async login(email: string, passwordHash: string): Promise<AuthResponse> {
    const user = await this.validateUser(email, passwordHash);
    const response = this.buildAuthResponse(user);

    const family = await this.familyService.getFamilySummaryForUser(user.id);
    if (family) {
      response.family = {
        id: family.id,
        name: family.name,
        role: family.role,
        inviteCode: family.inviteCode,
      };
    }

    return response;
  }

  refresh(refreshToken: string): Tokens {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as
      | TokenPayload
      | string;
    if (typeof decoded === 'string' || !decoded?.email || !decoded?.userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens({
      email: decoded.email,
      userId: decoded.userId,
    });
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toPublicUser(user);
  }

  /** Always returns the same message — do not reveal whether email exists. */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const normalized = email?.trim();
    const genericMessage =
      'Если этот email зарегистрирован, мы отправили ссылку для сброса пароля.';

    if (!normalized) {
      return { message: genericMessage };
    }

    const user = await this.userService.findByEmail(normalized);
    if (!user) {
      return { message: genericMessage };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const ttlMin = Number.isFinite(RESET_TOKEN_TTL_MIN) ? RESET_TOKEN_TTL_MIN : 60;
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    await this.resetTokenRepo.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    await this.resetTokenRepo.save(
      this.resetTokenRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      }),
    );

    const resetLink = `${getPublicAppUrl()}/pages/auth/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await this.mailService.sendPasswordResetEmail({
        toEmail: user.email,
        toName: user.name,
        resetLink,
        idempotencyKey: `reset-${user.id}-${Date.now()}`,
      });
    } catch {
      // Do not leak mail errors to client — still return generic success.
    }

    return { message: genericMessage };
  }

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    if (!token?.trim()) {
      return { valid: false };
    }
    const record = await this.findValidResetToken(token);
    return { valid: !!record };
  }

  async resetPassword(
    token: string,
    passwordHash: string,
  ): Promise<{ message: string }> {
    if (!token?.trim() || !passwordHash) {
      throw new BadRequestException('Token and passwordHash are required');
    }

    const record = await this.findValidResetToken(token);
    if (!record) {
      throw new BadRequestException(
        'Ссылка недействительна или истекла. Запросите сброс пароля снова.',
      );
    }

    const updated = await this.userService.update(record.userId, {
      passwordHash,
    });
    if (!updated) {
      throw new NotFoundException('User not found');
    }

    record.usedAt = new Date();
    await this.resetTokenRepo.save(record);

    await this.resetTokenRepo.update(
      { userId: record.userId, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    return { message: 'Пароль успешно обновлён' };
  }

  private async findValidResetToken(
    rawToken: string,
  ): Promise<PasswordResetToken | null> {
    const tokenHash = hashToken(rawToken.trim());
    const now = new Date();
    return this.resetTokenRepo.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
    });
  }
}
