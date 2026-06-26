import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { JwtGuard } from '../database/guards/jwt.guard';
import { UploadService } from './upload.service';
import { CreateWishInput, UpdateWishInput, WishService } from './wish.service';

interface AuthUser {
  userId: string;
  email: string;
}

class CreateWishRequest implements CreateWishInput {
  title!: string;
  description?: string;
  category?: string;
  budget?: string;
  link?: string;
  image?: string;
  alt?: string;
  visibility?: 'private' | 'family';
}

class UpdateWishRequest implements UpdateWishInput {
  title?: string;
  description?: string;
  category?: string;
  budget?: string;
  link?: string;
  image?: string;
  alt?: string;
  visibility?: 'private' | 'family';
}

@Controller('api/wishes')
export class WishController {
  constructor(private readonly wishService: WishService) {}

  @Get('mine')
  @UseGuards(JwtGuard)
  findMine(@GetUser() user: AuthUser) {
    return this.wishService.findMine(user.userId);
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@GetUser() user: AuthUser, @Body() body: CreateWishRequest) {
    return this.wishService.create(user.userId, body);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(
    @GetUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateWishRequest,
  ) {
    return this.wishService.update(user.userId, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async remove(@GetUser() user: AuthUser, @Param('id') id: string) {
    await this.wishService.remove(user.userId, id);
    return { ok: true };
  }
}

@Controller('api/uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('wish-image')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = process.env.UPLOAD_DIR
            ? join(process.env.UPLOAD_DIR, 'wishes')
            : join(process.cwd(), 'uploads', 'wishes');
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadWishImage(@UploadedFile() file: Express.Multer.File) {
    this.uploadService.assertAllowedImage(file);
    return {
      url: this.uploadService.toPublicUrl(file.filename),
      alt: file.originalname,
    };
  }

  @Post('goal-image')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = process.env.UPLOAD_DIR
            ? join(process.env.UPLOAD_DIR, 'goals')
            : join(process.cwd(), 'uploads', 'goals');
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadGoalImage(@UploadedFile() file: Express.Multer.File) {
    this.uploadService.assertAllowedImage(file);
    return {
      url: this.uploadService.toPublicGoalUrl(file.filename),
      alt: file.originalname,
    };
  }
}
