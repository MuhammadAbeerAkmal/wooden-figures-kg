import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from './config.js';
import { dataSourceOptions } from './database/data-source.js';
import { ENTITIES } from './database/entities/index.js';
import { FiguresController } from './figures/figures.controller.js';
import { FiguresService } from './figures/figures.service.js';
import { HealthController } from './health.controller.js';
import { RdfController } from './rdf/rdf.controller.js';
import { RdfService } from './rdf/rdf.service.js';
import { SparqlClient } from './rdf/sparql.client.js';
import { StartupService } from './startup.service.js';
import { VocabController } from './vocab/vocab.controller.js';
import { VocabService } from './vocab/vocab.service.js';

/**
 * The API is small, so everything lives in one module:
 *  - figures/ and vocab/  relational model (phase 1)
 *  - rdf/                 CIDOC-CRM mapping, SPARQL client, SHACL (phase 2)
 *  - compare/             SQL vs SPARQL competency questions (phase 3)
 */
@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions()), TypeOrmModule.forFeature(ENTITIES)],
  // RdfController is listed before FiguresController so that
  // /figures/:inventoryNumber/rdf is matched before /figures/:inventoryNumber.
  controllers: [HealthController, RdfController, FiguresController, VocabController],
  providers: [
    FiguresService,
    VocabService,
    RdfService,
    StartupService,
    { provide: SparqlClient, useFactory: () => new SparqlClient(config.sparqlEndpoint) },
  ],
})
export class AppModule {}
