import { Injectable, Logger } from '@nestjs/common';
import type { OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { config } from './config.js';
import { seedDatabase } from './database/seed.js';
import { RdfService } from './rdf/rdf.service.js';

const RETRIES = 15;
const RETRY_DELAY_MS = 2000;

/** Prepares the data when the API starts, so `docker compose up` is the only command needed. */
@Injectable()
export class StartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly rdf: RdfService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (config.seedOnStart) {
      const inserted = await seedDatabase(this.dataSource);
      this.logger.log(inserted ? `Seeded ${inserted} fictional figures` : 'Database already seeded');
    }
    // Not awaited: the relational endpoints should work even while Oxigraph is still starting.
    if (config.loadRdfOnStart) void this.loadRdf();
  }

  private async loadRdf(): Promise<void> {
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      try {
        const triples = await this.rdf.loadIntoTriplestore();
        this.logger.log(`Loaded ${triples} triples into ${config.sparqlEndpoint}`);
        return;
      } catch (error) {
        this.logger.warn(`Triplestore not ready (attempt ${attempt}/${RETRIES}): ${(error as Error).message}`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    this.logger.error('Gave up loading RDF. Start Oxigraph and run "npm run rdf:load".');
  }
}
