import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config.js';
import { dataSourceOptions } from '../database/data-source.js';
import { Figure } from '../database/entities/index.js';
import { seedDatabase } from '../database/seed.js';
import { FiguresService } from '../figures/figures.service.js';
import { RdfService } from '../rdf/rdf.service.js';
import { SparqlClient } from '../rdf/sparql.client.js';
import { VocabService } from '../vocab/vocab.service.js';

/**
 * Wires the services by hand for the command line scripts, without starting
 * the NestJS application. `database` defaults to the SQLite file from the config.
 */
export async function createContext(database?: string) {
  const dataSource = new DataSource(dataSourceOptions(database));
  await dataSource.initialize();
  const seeded = await seedDatabase(dataSource);

  const figures = new FiguresService(dataSource.getRepository(Figure));
  const vocab = new VocabService(dataSource);
  const sparql = new SparqlClient(config.sparqlEndpoint);
  const rdf = new RdfService(figures, vocab, sparql);

  return { dataSource, seeded, figures, vocab, sparql, rdf };
}
