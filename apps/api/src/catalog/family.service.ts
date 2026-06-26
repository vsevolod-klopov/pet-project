import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { FamilyInvite } from './entities/family-invite.entity';
import { FamilyMember } from './entities/family-member.entity';
import { User } from '../database/entities/user.entity';

const INVITE_TTL_DAYS = 365;

export interface FamilyInviteInfo {
  code: string;
  familyId: string;
  familyName: string;
  expiresAt: string;
}

export interface FamilySetupResult {
  familyId: string;
  familyName: string;
  role: 'owner' | 'member';
  inviteCode?: string;
}

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family) private readonly families: Repository<Family>,
    @InjectRepository(FamilyMember) private readonly members: Repository<FamilyMember>,
    @InjectRepository(FamilyInvite) private readonly invites: Repository<FamilyInvite>,
  ) {}

  async findMemberByUserId(userId: string): Promise<FamilyMember | null> {
    return this.members.findOne({ where: { userId } });
  }

  async createFamilyForUser(
    user: User,
    familyName?: string,
  ): Promise<FamilySetupResult> {
    const existing = await this.findMemberByUserId(user.id);
    if (existing) {
      throw new BadRequestException('User already belongs to a family');
    }

    const name = (familyName?.trim() || `Семья ${user.name}`).slice(0, 100);
    const family = await this.families.save({
      name,
      ownerId: user.id,
    });

    await this.members.save({
      familyId: family.id,
      userId: user.id,
      displayName: user.name,
      initials: this.buildInitials(user.name),
      role: 'owner',
      gradient: 'base',
    });

    const inviteCode = await this.ensureFamilyInviteCode(family.id, user.id);

    return {
      familyId: family.id,
      familyName: family.name,
      role: 'owner',
      inviteCode,
    };
  }

  async joinFamilyByCode(user: User, rawCode: string): Promise<FamilySetupResult> {
    const existing = await this.findMemberByUserId(user.id);
    if (existing) {
      throw new BadRequestException('User already belongs to a family');
    }

    const code = this.normalizeInviteCode(rawCode);
    if (!code) {
      throw new BadRequestException('Invite code is required');
    }

    const invite = await this.invites.findOne({ where: { code } });
    if (!invite) {
      throw new BadRequestException('Invalid invite code');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite code has expired');
    }

    const family = await this.families.findOne({ where: { id: invite.familyId } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    await this.members.save({
      familyId: family.id,
      userId: user.id,
      displayName: user.name,
      initials: this.buildInitials(user.name),
      role: 'member',
      gradient: 'alt',
    });

    return {
      familyId: family.id,
      familyName: family.name,
      role: 'member',
    };
  }

  async validateInviteCode(rawCode: string): Promise<{ valid: boolean; familyName?: string }> {
    const code = this.normalizeInviteCode(rawCode);
    if (!code) {
      return { valid: false };
    }

    const invite = await this.invites.findOne({ where: { code } });
    if (!invite || invite.expiresAt < new Date()) {
      return { valid: false };
    }

    const family = await this.families.findOne({ where: { id: invite.familyId } });
    if (!family) {
      return { valid: false };
    }

    return { valid: true, familyName: family.name };
  }

  async getFamilyInviteForUser(userId: string): Promise<FamilyInviteInfo> {
    const member = await this.findMemberByUserId(userId);
    if (!member) {
      throw new NotFoundException('User is not a member of any family');
    }

    const family = await this.families.findOne({ where: { id: member.familyId } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const code = await this.ensureFamilyInviteCode(family.id, family.ownerId);
    const invite = await this.invites.findOne({ where: { familyId: family.id } });
    if (!invite) {
      throw new NotFoundException('Invite code not found');
    }

    return {
      code,
      familyId: family.id,
      familyName: family.name,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  private async ensureFamilyInviteCode(familyId: string, createdBy: string): Promise<string> {
    const existing = await this.invites.findOne({ where: { familyId } });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    if (existing) {
      if (existing.expiresAt >= new Date()) {
        return existing.code;
      }

      existing.code = await this.generateUniqueCode(existing.code);
      existing.expiresAt = expiresAt;
      await this.invites.save(existing);
      return existing.code;
    }

    const code = await this.generateUniqueCode();
    await this.invites.save({
      familyId,
      code,
      createdBy,
      expiresAt,
    });

    return code;
  }

  private async generateUniqueCode(excludeCode?: string): Promise<string> {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      if (code === excludeCode) {
        continue;
      }
      const exists = await this.invites.exist({ where: { code } });
      if (!exists) {
        return code;
      }
    }

    throw new BadRequestException('Could not generate invite code, try again');
  }

  normalizeInviteCode(raw: string): string | null {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length < 5 || digits.length > 6) {
      return null;
    }
    return digits;
  }

  private buildInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 4);
    }
    return name.trim().slice(0, 2).toUpperCase() || '??';
  }
}
