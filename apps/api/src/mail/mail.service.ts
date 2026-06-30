import { Injectable, Logger } from '@nestjs/common';
import { buildPasswordResetEmailHtml } from './password-reset-email.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordResetEmail(options: {
    toEmail: string;
    toName: string;
    resetLink: string;
    idempotencyKey: string;
  }): Promise<void> {
    const apiKey = process.env.RUSENDER_API_KEY?.trim();
    const keyId = process.env.RUSENDER_KEY_ID?.trim();
    const fromEmail = process.env.RUSENDER_FROM_EMAIL?.trim();
    const fromName =
      process.env.RUSENDER_FROM_NAME?.trim() || 'Домашняя карта желаний';
    const apiBase =
      process.env.RUSENDER_API_BASE?.trim() ||
      'https://api.rusender.ru/api/v1/external-mails/send';
    const ttlMin = Number(process.env.RESET_TOKEN_TTL_MIN || 60);

    if (!apiKey || apiKey.includes('placeholder') || !keyId || !fromEmail) {
      this.logger.warn(
        'RuSender not configured (RUSENDER_API_KEY / RUSENDER_KEY_ID / RUSENDER_FROM_EMAIL). Skipping email send.',
      );
      this.logger.log(`Password reset link (dev): ${options.resetLink}`);
      return;
    }

    const url = apiBase.endsWith('/')
      ? `${apiBase}${keyId}`
      : `${apiBase}/${keyId}`;

    const html = buildPasswordResetEmailHtml({
      userName: options.toName,
      resetLink: options.resetLink,
      expiresMinutes: Number.isFinite(ttlMin) ? ttlMin : 60,
    });

    const body = {
      idempotencyKey: options.idempotencyKey,
      mail: {
        to: { email: options.toEmail, name: options.toName || options.toEmail },
        from: { email: fromEmail, name: fromName },
        subject: 'Сброс пароля — Домашняя карта желаний',
        html,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(
        `RuSender API error ${response.status}: ${text.slice(0, 500)}`,
      );
      throw new Error('Failed to send password reset email');
    }

    this.logger.log(`Password reset email sent to ${options.toEmail}`);
  }
}
