import fs from 'node:fs';
import path from 'node:path';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { config } from '../config.js';
import { ENTITIES } from './entities/index.js';
import { MIGRATIONS } from './migrations/index.js';

/**
 * One place for the database settings, shared by the NestJS app, the scripts,
 * the tests (in-memory) and the TypeORM CLI.
 */
export function dataSourceOptions(database: string = config.databasePath): DataSourceOptions {
  if (database !== ':memory:') fs.mkdirSync(path.dirname(database), { recursive: true });
  return {
    type: 'better-sqlite3',
    database,
    entities: ENTITIES,
    migrations: MIGRATIONS,
    migrationsRun: true,
    synchronize: false,
  };
}

/** Default export for the TypeORM CLI (`npm run migration:generate`). */
export default new DataSource(dataSourceOptions());
