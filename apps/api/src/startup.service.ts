import { Injectable, Logger } from '@nestjs/common';
import type { OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { config } from './config.js';
import { seedDatabase } from './database/seed.js';

/** Prepares the data when the API starts, so `docker compose up` is the only command needed. */
@Injectable()
export class StartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    if (config.seedOnStart) {
      const inserted = await seedDatabase(this.dataSource);
      this.logger.log(inserted ? `Seeded ${inserted} fictional figures` : 'Database already seeded');
    }
  }
}
