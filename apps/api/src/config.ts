import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root, resolved from apps/api/src (or apps/api/dist after build). */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const flag = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : value.toLowerCase() === 'true';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databasePath: path.resolve(REPO_ROOT, process.env.DATABASE_PATH ?? './data/figures.sqlite'),
  sparqlEndpoint: (process.env.SPARQL_ENDPOINT ?? 'http://localhost:7878').replace(/\/$/, ''),
  shapesPath: path.resolve(REPO_ROOT, 'shapes/figure.shacl.ttl'),
  turtleExportPath: path.resolve(REPO_ROOT, 'data/figures.ttl'),
  seedOnStart: flag(process.env.SEED_ON_START, true),
  loadRdfOnStart: flag(process.env.LOAD_RDF_ON_START, true),
};
