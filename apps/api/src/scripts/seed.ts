import { config } from '../config.js';
import { createContext } from './context.js';

/** Creates the SQLite database (migrations) and inserts the fictional data if it is empty. */
const { dataSource, seeded } = await createContext();
console.log(
  seeded
    ? `Seeded ${seeded} fictional figures into ${config.databasePath}`
    : `${config.databasePath} already contains data, nothing to do`,
);
await dataSource.destroy();
