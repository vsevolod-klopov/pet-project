import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { MailModule } from '../mail/mail.module';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PasswordResetToken]),
    CatalogModule,
    MailModule,
  ],
  providers: [UserService, AuthService],
  controllers: [UserController, AuthController],
  exports: [UserService, AuthService],
})
export class UserModule {}
