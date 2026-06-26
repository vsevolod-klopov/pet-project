import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.checkHealth();
  }

  @Get('ready')
  getReadiness() {
    return this.healthService.checkReadiness();
  }

  @Get('live')
  getLiveness() {
    return this.healthService.checkLiveness();
  }
}
