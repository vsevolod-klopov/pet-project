import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();

  const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  const port = process.env.PORT ?? 3000;
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}`,
    'NestApplication',
  );
  Logger.log(`📝 Environment: ${nodeEnv}`, 'NestApplication');
  Logger.log(`📁 Uploads: ${uploadDir}`, 'NestApplication');
}
bootstrap();
