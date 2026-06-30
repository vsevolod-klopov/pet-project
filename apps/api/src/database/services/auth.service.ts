import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { FamilyService } from '../../catalog/family.service';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { toPublicUser, PublicUser } from '../user.mapper';

export type FamilyMode = 'create' | 'join';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

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
}
