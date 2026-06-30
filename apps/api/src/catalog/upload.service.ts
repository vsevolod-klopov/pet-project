import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { basename, extname, join } from 'path';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class UploadService implements OnModuleInit {
  readonly uploadRoot: string;
  readonly wishesDir: string;
  readonly goalsDir: string;
  readonly avatarsDir: string;

  constructor() {
    this.uploadRoot = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    this.wishesDir = join(this.uploadRoot, 'wishes');
    this.goalsDir = join(this.uploadRoot, 'goals');
    this.avatarsDir = join(this.uploadRoot, 'avatars');
  }

  onModuleInit(): void {
    mkdirSync(this.wishesDir, { recursive: true });
    mkdirSync(this.goalsDir, { recursive: true });
    mkdirSync(this.avatarsDir, { recursive: true });
  }

  getWishesUploadDir(): string {
    return this.wishesDir;
  }

  getGoalsUploadDir(): string {
    return this.goalsDir;
  }

  getAvatarsUploadDir(): string {
    return this.avatarsDir;
  }

  getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }

  assertAllowedImage(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (file.size > MAX_FILE_SIZE) {
      this.deletePhysicalFile(file.path);
      throw new BadRequestException('Image must be 5 MB or smaller');
    }

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
      this.deletePhysicalFile(file.path);
      throw new BadRequestException('Only JPEG, PNG, WebP and GIF images are allowed');
    }
  }

  toPublicUrl(filename: string): string {
    return `/uploads/wishes/${filename}`;
  }

  toPublicGoalUrl(filename: string): string {
    return `/uploads/goals/${filename}`;
  }

  toPublicAvatarUrl(filename: string): string {
    return `/uploads/avatars/${filename}`;
  }

  deleteWishImage(imageUrl?: string | null): void {
    if (!imageUrl?.startsWith('/uploads/wishes/')) {
      return;
    }

    const filename = basename(imageUrl);
    const fullPath = join(this.wishesDir, filename);
    this.deletePhysicalFile(fullPath);
  }

  deleteGoalImage(imageUrl?: string | null): void {
    if (!imageUrl?.startsWith('/uploads/goals/')) {
      return;
    }

    const filename = basename(imageUrl);
    const fullPath = join(this.goalsDir, filename);
    this.deletePhysicalFile(fullPath);
  }

  deleteAvatarImage(imageUrl?: string | null): void {
    if (!imageUrl?.startsWith('/uploads/avatars/')) {
      return;
    }

    const filename = basename(imageUrl);
    const fullPath = join(this.avatarsDir, filename);
    this.deletePhysicalFile(fullPath);
  }

  private deletePhysicalFile(fullPath: string): void {
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  }
}
