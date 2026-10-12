import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../database/data-source.js';
import { seedDatabase } from '../database/seed.js';

/** A fresh in-memory SQLite database: migrations applied, fictional data seeded. */
export async function createTestDatabase(): Promise<DataSource> {
  const dataSource = new DataSource(dataSourceOptions(':memory:'));
  await dataSource.initialize();
  await seedDatabase(dataSource);
  return dataSource;
}
