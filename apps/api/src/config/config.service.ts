import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly envConfig: Record<string, any>;

  constructor() {
    this.envConfig = {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
      logLevel: process.env.LOG_LEVEL || 'debug',
      databaseUrl: process.env.DATABASE_URL,
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    };
  }

  get(key: string): any {
    return this.envConfig[key];
  }

  get nodeEnv(): string {
    return this.envConfig.nodeEnv;
  }

  get port(): number {
    return this.envConfig.port;
  }

  get swaggerEnabled(): boolean {
    return this.envConfig.swaggerEnabled;
  }

  get logLevel(): string {
    return this.envConfig.logLevel;
  }

  get databaseUrl(): string | undefined {
    return this.envConfig.databaseUrl;
  }

  get jwtSecret(): string | undefined {
    return this.envConfig.jwtSecret;
  }

  get jwtExpiration(): string {
    return this.envConfig.jwtExpiration;
  }

  isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  isStaging(): boolean {
    return this.nodeEnv === 'staging';
  }
}
