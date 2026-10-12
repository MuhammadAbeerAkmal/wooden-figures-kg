import fs from 'node:fs/promises';
import { config } from '../config.js';
import { createContext } from './context.js';

/** Converts the relational data to CIDOC-CRM and writes it to data/figures.ttl. */
const { dataSource, rdf } = await createContext();
const quads = await rdf.buildDataset();
await fs.writeFile(config.turtleExportPath, await rdf.exportTurtle(), 'utf8');
console.log(`Wrote ${quads.length} triples to ${config.turtleExportPath}`);
await dataSource.destroy();
